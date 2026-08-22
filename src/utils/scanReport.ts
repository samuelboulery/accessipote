import type {
  ClassicStatus,
  CriteriaRGAA,
  Evidence,
  ScanCertainty,
  ScanOutcome,
  ScanReport,
  ScanVerdict,
} from '../types';

/** Version de rapport que le scan produit aujourd'hui. */
export const SCAN_SCHEMA = 3;

/**
 * Ce qu'une preuve pèse au plus, une fois entrée.
 *
 * Le moteur borne déjà ce qu'il écrit ; un fichier vient du dehors et n'est
 * tenu par rien. Sans plafond ici, un rapport démesuré remplirait le quota de
 * `localStorage` et l'audit ne se sauverait plus.
 */
const EVIDENCE_MAX = 3;
const SNIPPET_MAX = 200;

/**
 * Versions que cette application sait lire.
 *
 * Les anciennes restent acceptées : la 1 ignore la certitude, la 2 la porte
 * sous la forme d'un verdict `suspect` qui se relit ici en échec probable. Un
 * auditeur ne doit pas voir un rapport refusé parce que le moteur a évolué
 * entre le scan et l'import.
 */
const READABLE_SCHEMAS = [1, 2, 3];

const VERDICTS: ScanVerdict[] = ['fail', 'na', 'pass', 'unknown'];
const CERTAINTIES: ScanCertainty[] = ['proven', 'probable'];

/** Le verdict du schéma 2 : un échec que rien ne prouve. */
const LEGACY_SUSPECT = 'suspect';

/**
 * Verdicts que le scan est autorisé à écrire sans intervention humaine — et
 * seulement quand ils sont prouvés.
 *
 * `pass` en est absent, et ce n'est pas un oubli : « rien trouvé dans les états
 * scannés » ne prouve pas la conformité. Il passe par une confirmation.
 */
const DIRECT_STATUS: Partial<Record<ScanVerdict, ClassicStatus>> = {
  fail: 'non-conforme',
  na: 'non-applicable',
};

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clip(text: string): string {
  return text.length > SNIPPET_MAX ? text.slice(0, SNIPPET_MAX) : text;
}

function parseEvidence(raw: unknown, criteriaId: string): Evidence {
  if (!isRecord(raw) || typeof raw.url !== 'string') {
    fail(`Preuve invalide sur le critère ${criteriaId} : une preuve doit porter sa page.`);
  }
  return {
    url: clip(raw.url as string),
    ...(typeof raw.selector === 'string' ? { selector: clip(raw.selector) } : {}),
    ...(typeof raw.snippet === 'string' ? { snippet: clip(raw.snippet) } : {}),
  };
}

function parseVerdict(raw: unknown, criteriaId: string): ScanVerdict {
  // Un `suspect` de schéma 2 disait « non conforme probable » : il se relit sur
  // les deux axes, sans quoi le travail fait avant la bascule serait perdu.
  if (raw === LEGACY_SUSPECT) return 'fail';
  if (typeof raw !== 'string' || !VERDICTS.includes(raw as ScanVerdict)) {
    fail(`Verdict inconnu sur le critère ${criteriaId} : « ${String(raw)} ».`);
  }
  return raw as ScanVerdict;
}

function parseCertainty(raw: unknown, verdict: unknown, criteriaId: string): ScanCertainty {
  if (raw === undefined) return verdict === LEGACY_SUSPECT ? 'probable' : 'proven';
  if (typeof raw !== 'string' || !CERTAINTIES.includes(raw as ScanCertainty)) {
    fail(`Certitude inconnue sur le critère ${criteriaId} : « ${String(raw)} ».`);
  }
  return raw as ScanCertainty;
}

function parseOutcome(raw: unknown, criteriaId: string): ScanOutcome {
  if (!isRecord(raw)) fail(`Résultat illisible pour le critère ${criteriaId}.`);

  const testVerdicts: Record<string, ScanVerdict> = {};
  if (raw.testVerdicts !== undefined) {
    if (!isRecord(raw.testVerdicts)) fail(`Tests illisibles pour le critère ${criteriaId}.`);
    for (const [testId, verdict] of Object.entries(raw.testVerdicts)) {
      testVerdicts[testId] = parseVerdict(verdict, criteriaId);
    }
  }

  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.slice(0, EVIDENCE_MAX).map(item => parseEvidence(item, criteriaId))
    : [];

  return {
    verdict: parseVerdict(raw.verdict, criteriaId),
    certainty: parseCertainty(raw.certainty, raw.verdict, criteriaId),
    testVerdicts,
    evidence,
  };
}

/**
 * Ce qu'un échantillon partiel permet de conclure, et ce qu'il ne permet pas.
 *
 * Un contre-exemple trouvé dans un en-tête, ou sur une page qu'un crawl a
 * visitée, reste un contre-exemple du site. L'absence d'un support, elle, ne
 * prouve plus rien : « aucun tableau dans cet en-tête » ne fait pas un site sans
 * tableau, et ce qu'un crawl ne voit pas à `load` peut n'attendre qu'un clic. Le
 * non applicable rejoint donc les critères à vérifier — sans quoi le scan de
 * zone serait le moyen le plus simple de fabriquer des non applicables faux.
 *
 * La règle est appliquée ici, à la frontière : l'outil qui a produit le rapport
 * n'a pas à être cru sur parole.
 */
function partialOutcome(outcome: ScanOutcome, partial: boolean): ScanOutcome {
  if (!partial || outcome.verdict !== 'na') return outcome;
  return { ...outcome, certainty: 'probable' };
}

/**
 * Valide un rapport de scan reçu sous forme de texte.
 *
 * C'est une frontière du système : le fichier vient du dehors et rien n'y est
 * présumé. Un rapport douteux est rejeté net, avec un message qui dit lequel des
 * champs a manqué — jamais partiellement accepté, ce qui écrirait des statuts
 * sur la foi d'un fichier qu'on n'a pas compris.
 *
 * `knownCriteriaIds` vient de `criteria.json` : un identifiant absent du
 * référentiel signale un rapport produit par une autre version des données, et
 * non un critère à créer.
 */
export function parseScanReport(text: string, knownCriteriaIds: ReadonlySet<string>): ScanReport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    fail("Le fichier n'est pas un JSON valide.");
  }

  if (!isRecord(raw) || !isRecord(raw.criteria)) {
    fail("Le fichier n'est pas un rapport de scan.");
  }

  if (typeof raw.schema !== 'number' || !READABLE_SCHEMAS.includes(raw.schema)) {
    fail(
      `Schéma de rapport inconnu : ${String(raw.schema)} au lieu de ${READABLE_SCHEMAS.join(' ou ')}. ` +
        'Ce rapport vient d’une autre version de l’outil de scan.',
    );
  }

  if (typeof raw.scannedAt !== 'string') fail('Rapport incomplet : le champ « scannedAt » manque.');
  if (!Array.isArray(raw.urls) || raw.urls.some(url => typeof url !== 'string')) {
    fail('Rapport incomplet : le champ « urls » doit être une liste d’adresses.');
  }

  if (
    raw.zones !== undefined &&
    (!Array.isArray(raw.zones) || raw.zones.some(zone => typeof zone !== 'string'))
  ) {
    fail('Rapport illisible : le champ « zones » doit être une liste de sélecteurs.');
  }
  const zones = raw.zones as string[] | undefined;

  if (raw.crawled !== undefined && typeof raw.crawled !== 'boolean') {
    fail('Rapport illisible : le champ « crawled » doit être un booléen.');
  }
  const crawled = raw.crawled === true;
  const partial = crawled || (zones !== undefined && zones.length > 0);

  const criteria: Record<string, ScanOutcome> = {};
  for (const [criteriaId, outcome] of Object.entries(raw.criteria)) {
    if (!knownCriteriaIds.has(criteriaId)) {
      fail(`Critère inconnu dans le rapport : « ${criteriaId} ».`);
    }
    criteria[criteriaId] = partialOutcome(parseOutcome(outcome, criteriaId), partial);
  }

  return {
    schema: raw.schema,
    scannedAt: raw.scannedAt,
    urls: raw.urls as string[],
    ...(zones ? { zones } : {}),
    ...(crawled ? { crawled } : {}),
    criteria,
  };
}

/** Un critère du rapport, prêt à être écrit dans l'audit. */
export interface ScanPlanEntry {
  criteriaId: string;
  status: ClassicStatus;
  /** Tests RGAA qui ont tranché — ceux dont le verdict porte celui du critère. */
  testIds: string[];
  evidence: Evidence[];
  /**
   * Le statut repose sur un indice, pas sur une preuve.
   *
   * Voyage jusque dans la provenance : un tag qui ne distinguerait pas les deux
   * ferait passer un soupçon pour un constat.
   */
  fromHint?: boolean;
}

export interface ScanPlan {
  /** Échecs et non applicables prouvés : écrits directement. */
  direct: ScanPlanEntry[];
  /**
   * Échecs soupçonnés sans être prouvés : proposés, jamais écrits.
   *
   * L'indice vaut d'être montré — il désigne où regarder — mais il ne tranche
   * pas. C'est l'auditeur qui décide, et le statut devient le sien.
   */
  probable: ScanPlanEntry[];
  /** Conformes proposés : jamais écrits sans confirmation explicite. */
  proposed: ScanPlanEntry[];
  /**
   * Critères du périmètre que le scan n'a pas tranchés.
   *
   * Compté et affiché : un audit qui tait ses angles morts trompe son lecteur.
   */
  unscanned: number;
}

function entryFrom(criteriaId: string, outcome: ScanOutcome, status: ClassicStatus): ScanPlanEntry {
  return {
    criteriaId,
    status,
    testIds: Object.entries(outcome.testVerdicts)
      .filter(([, verdict]) => verdict === outcome.verdict)
      .map(([testId]) => testId),
    evidence: outcome.evidence,
  };
}

/**
 * Répartit les verdicts du rapport par certitude, dans l'ordre du référentiel.
 *
 * Le périmètre est celui de l'audit : un critère hors des thèmes retenus n'est
 * ni appliqué, ni compté comme non regardé.
 */
export function planScanApplication(report: ScanReport, criteria: CriteriaRGAA[]): ScanPlan {
  const plan: ScanPlan = { direct: [], probable: [], proposed: [], unscanned: 0 };

  for (const criterion of criteria) {
    const outcome = report.criteria[criterion.id];
    if (!outcome) {
      plan.unscanned += 1;
      continue;
    }

    // Le conforme ne s'écrit jamais seul, prouvé ou non : il se propose.
    if (outcome.verdict === 'pass') {
      plan.proposed.push(entryFrom(criterion.id, outcome, 'conforme'));
      continue;
    }

    const status = DIRECT_STATUS[outcome.verdict];
    if (status === undefined) {
      plan.unscanned += 1;
    } else if (outcome.certainty === 'proven') {
      plan.direct.push(entryFrom(criterion.id, outcome, status));
    } else {
      // Le verdict est conservé : un non applicable probable se propose en non
      // applicable, jamais en non conforme.
      plan.probable.push({ ...entryFrom(criterion.id, outcome, status), fromHint: true });
    }
  }

  return plan;
}
