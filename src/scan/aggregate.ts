// Les imports de ce dossier portent leur extension `.ts`, contrairement au
// reste du projet : `src/scripts/scan.ts` est exécuté par Node directement, et
// la résolution ESM de Node exige un spécificateur complet.
import type {
  AxeRuleResult,
  Certainty,
  CriterionOutcome,
  Evidence,
  PageScan,
  RgaaMapping,
  TestVerdict,
} from './types.ts';

/** Un rapport finit dans localStorage (~5 Mo) : les preuves se plafonnent. */
export const EVIDENCE_MAX = 3;
export const SNIPPET_MAX = 200;

/** Un verdict et ce qui le fonde. Les deux voyagent toujours ensemble. */
interface Judgement {
  verdict: TestVerdict;
  certainty: Certainty;
}

const PROVEN = (verdict: TestVerdict): Judgement => ({ verdict, certainty: 'proven' });
const PROBABLE = (verdict: TestVerdict): Judgement => ({ verdict, certainty: 'probable' });

/**
 * Verdict d'un test sur une seule page, avec sa certitude.
 *
 * L'ordre des règles n'est pas cosmétique :
 *
 * 1. l'absence du support rend le test non applicable — c'est le seul chemin
 *    vers le NA, `inapplicable` d'axe n'est jamais consulté (axe raisonne par
 *    page, le RGAA par échantillon). La certitude suit la nature du support :
 *    un support volatil n'apparaît parfois qu'après un clic, son absence ne
 *    prouve donc rien ;
 * 2. un contre-exemple, trouvé par sélecteur ou par axe, prouve l'échec ;
 * 3. un indice — sélecteur, règle-indice, ou `incomplete` d'axe — rend l'échec
 *    probable. Un `incomplete` ne prouve rien : c'est là que se logent les
 *    contrastes sur image de fond, sur dégradé, sur opacité. Le compter comme
 *    échec ou comme succès serait mentir ; le taire serait le gâcher ;
 * 4. le succès n'est retenu que si tout ce que le test sait vérifier a été
 *    effectivement vérifié sur la page. Un sélecteur non évalué n'est pas un
 *    sélecteur sans résultat.
 */
function verdictOnPage(mapping: RgaaMapping, page: PageScan): Judgement {
  if (mapping.naWhen !== undefined && (page.present[mapping.naWhen] ?? 0) === 0) {
    return mapping.volatileSupport ? PROBABLE('na') : PROVEN('na');
  }

  const counterExamples = mapping.failWhen === undefined ? undefined : page.found[mapping.failWhen];
  if (counterExamples !== undefined && counterExamples.length > 0) return PROVEN('fail');

  const rules = mapping.axeRules ?? [];
  if (rules.some(rule => page.violations.some(violation => violation.id === rule))) {
    return PROVEN('fail');
  }

  const hints = mapping.probableWhen === undefined ? undefined : page.found[mapping.probableWhen];
  if (hints !== undefined && hints.length > 0) return PROBABLE('fail');

  const probableRules = mapping.probableRules ?? [];
  if (probableRules.some(rule => page.violations.some(violation => violation.id === rule))) {
    return PROBABLE('fail');
  }

  const watched = [...rules, ...probableRules];
  if (watched.some(rule => page.incomplete.some(entry => entry.id === rule))) return PROBABLE('fail');

  const axeSatisfied = rules.length === 0 || rules.every(rule => page.passes.includes(rule));
  const selectorSatisfied = mapping.failWhen === undefined || counterExamples !== undefined;
  const somethingWasChecked = rules.length > 0 || counterExamples !== undefined;
  if (axeSatisfied && selectorSatisfied && somethingWasChecked) return PROVEN('pass');

  return PROVEN('unknown');
}

/** L'échec prouvé prime le probable, et le probable prime tout le reste. */
function combinePages(judgements: Judgement[]): Judgement {
  if (judgements.length === 0) return PROVEN('unknown');

  const fails = judgements.filter(judgement => judgement.verdict === 'fail');
  if (fails.length > 0) {
    return fails.some(judgement => judgement.certainty === 'proven')
      ? PROVEN('fail')
      : PROBABLE('fail');
  }

  const verdicts = judgements.map(judgement => judgement.verdict);
  // Un seul non applicable douteux suffit à rendre douteux celui de l'échantillon.
  if (verdicts.every(verdict => verdict === 'na')) {
    return judgements.some(judgement => judgement.certainty === 'probable')
      ? PROBABLE('na')
      : PROVEN('na');
  }
  if (verdicts.every(verdict => verdict === 'na' || verdict === 'pass')) return PROVEN('pass');
  return PROVEN('unknown');
}

/**
 * Verdict d'un critère à partir de ses tests.
 *
 * Le succès exige que *chaque* test soit de présence ou de format pure. Un seul
 * test de pertinence dans le lot et le critère retombe en indéterminé : la
 * machine ne tranche pas la pertinence d'une alternative ou d'un intitulé.
 */
function combineTests(tests: Array<Judgement & { provesPass: boolean }>): Judgement {
  const combined = combinePages(tests);
  if (combined.verdict !== 'pass') return combined;
  return tests.every(test => test.provesPass) ? combined : PROVEN('unknown');
}

function truncate(snippet: string): string {
  return snippet.length > SNIPPET_MAX ? snippet.slice(0, SNIPPET_MAX) : snippet;
}

function evidenceFrom(url: string, violation: AxeRuleResult): Evidence[] {
  return violation.nodes.map(node => ({
    url,
    selector: node.selector,
    snippet: truncate(node.snippet),
  }));
}

/**
 * Agrège les résultats page par page en un verdict par critère RGAA.
 *
 * Fonction pure : ni réseau, ni navigateur, ni horloge. Tout ce qui vient du
 * dehors a déjà été réduit en `PageScan` par la CLI.
 */
export function aggregate(
  pages: PageScan[],
  mappings: RgaaMapping[],
): Record<string, CriterionOutcome> {
  const outcomes: Record<string, CriterionOutcome> = {};

  const judgements: Record<string, Judgement> = {};

  for (const mapping of mappings) {
    const judgement = combinePages(pages.map(page => verdictOnPage(mapping, page)));
    const { verdict, certainty } = judgement;
    judgements[`${mapping.criterionId}/${mapping.testId}`] = judgement;

    const outcome = outcomes[mapping.criterionId] ?? {
      verdict: 'unknown' as TestVerdict,
      certainty: 'proven' as Certainty,
      testVerdicts: {},
      evidence: [],
    };
    outcome.testVerdicts[mapping.testId] = verdict;

    // Un soupçon sans sa preuve n'est pas instruisible : l'auditeur ne saurait
    // pas où regarder, et le laisserait tomber.
    if (verdict === 'fail') {
      const proven = certainty === 'proven';
      const selector = proven ? mapping.failWhen : mapping.probableWhen;
      const rules = proven ? (mapping.axeRules ?? []) : (mapping.probableRules ?? []);

      for (const page of pages) {
        const nodes = selector === undefined ? [] : (page.found[selector] ?? []);
        outcome.evidence.push(...evidenceFrom(page.url, { id: mapping.testId, nodes }));

        for (const rule of rules) {
          const found = [...page.violations, ...page.incomplete].find(entry => entry.id === rule);
          if (found) outcome.evidence.push(...evidenceFrom(page.url, found));
        }

        if (!proven) {
          for (const rule of mapping.axeRules ?? []) {
            const pending = page.incomplete.find(entry => entry.id === rule);
            if (pending) outcome.evidence.push(...evidenceFrom(page.url, pending));
          }
        }
      }
    }

    outcomes[mapping.criterionId] = outcome;
  }

  for (const [criterionId, outcome] of Object.entries(outcomes)) {
    const tests = mappings
      .filter(mapping => mapping.criterionId === criterionId)
      .map(mapping => ({
        ...judgements[`${criterionId}/${mapping.testId}`],
        provesPass: mapping.provesPass,
      }));

    const combined = combineTests(tests);
    outcome.verdict = combined.verdict;
    outcome.certainty = combined.certainty;
    outcome.evidence = outcome.evidence.slice(0, EVIDENCE_MAX);
  }

  return outcomes;
}
