import type {
  ClassicStatus,
  CriteriaRGAA,
  Evidence,
  ScanOutcome,
  ScanReport,
  ScanVerdict,
} from '../types';

/** Version de rapport que le scan produit aujourd'hui. */
export const SCAN_SCHEMA = 2;

/**
 * Versions que cette application sait lire.
 *
 * La 1 reste acceptée : elle ne connaît simplement pas le verdict `suspect`. Un
 * auditeur ne doit pas voir un rapport refusé parce que le moteur a évolué
 * entre le scan et l'import.
 */
const READABLE_SCHEMAS = [1, 2];

const VERDICTS: ScanVerdict[] = ['fail', 'na', 'pass', 'suspect', 'unknown'];

/**
 * Verdicts que le scan est autorisé à écrire sans intervention humaine.
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

function parseEvidence(raw: unknown, criteriaId: string): Evidence {
  if (!isRecord(raw) || typeof raw.url !== 'string') {
    fail(`Preuve invalide sur le critère ${criteriaId} : une preuve doit porter sa page.`);
  }
  return {
    url: raw.url as string,
    ...(typeof raw.selector === 'string' ? { selector: raw.selector } : {}),
    ...(typeof raw.snippet === 'string' ? { snippet: raw.snippet } : {}),
  };
}

function parseVerdict(raw: unknown, criteriaId: string): ScanVerdict {
  if (typeof raw !== 'string' || !VERDICTS.includes(raw as ScanVerdict)) {
    fail(`Verdict inconnu sur le critère ${criteriaId} : « ${String(raw)} ».`);
  }
  return raw as ScanVerdict;
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
    ? raw.evidence.map(item => parseEvidence(item, criteriaId))
    : [];

  return { verdict: parseVerdict(raw.verdict, criteriaId), testVerdicts, evidence };
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

  const criteria: Record<string, ScanOutcome> = {};
  for (const [criteriaId, outcome] of Object.entries(raw.criteria)) {
    if (!knownCriteriaIds.has(criteriaId)) {
      fail(`Critère inconnu dans le rapport : « ${criteriaId} ».`);
    }
    criteria[criteriaId] = parseOutcome(outcome, criteriaId);
  }

  return {
    schema: raw.schema,
    scannedAt: raw.scannedAt,
    urls: raw.urls as string[],
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
    const direct = outcome ? DIRECT_STATUS[outcome.verdict] : undefined;

    if (outcome && direct) plan.direct.push(entryFrom(criterion.id, outcome, direct));
    else if (outcome?.verdict === 'suspect') {
      plan.probable.push({ ...entryFrom(criterion.id, outcome, 'non-conforme'), fromHint: true });
    } else if (outcome?.verdict === 'pass') {
      plan.proposed.push(entryFrom(criterion.id, outcome, 'conforme'));
    } else plan.unscanned += 1;
  }

  return plan;
}
