// Les imports de ce dossier portent leur extension `.ts`, contrairement au
// reste du projet : `src/scripts/scan.ts` est exécuté par Node directement, et
// la résolution ESM de Node exige un spécificateur complet.
import type {
  AxeRuleResult,
  CriterionOutcome,
  Evidence,
  PageScan,
  RgaaMapping,
  TestVerdict,
} from './types.ts';

/** Un rapport finit dans localStorage (~5 Mo) : les preuves se plafonnent. */
export const EVIDENCE_MAX = 3;
export const SNIPPET_MAX = 200;

/**
 * Verdict d'un test sur une seule page.
 *
 * L'ordre des règles n'est pas cosmétique :
 *
 * 1. l'absence du support rend le test non applicable — c'est le seul chemin
 *    vers le NA, `inapplicable` d'axe n'est jamais consulté (axe raisonne par
 *    page, le RGAA par échantillon) ;
 * 2. un contre-exemple, trouvé par sélecteur ou par axe, prouve l'échec ;
 * 3. un `incomplete` d'axe ne prouve rien. C'est là que se logent les
 *    contrastes sur image de fond, sur dégradé, sur opacité. Le compter comme
 *    échec ou comme succès serait mentir ;
 * 4. le succès n'est retenu que si tout ce que le test sait vérifier a été
 *    effectivement vérifié sur la page. Un sélecteur non évalué n'est pas un
 *    sélecteur sans résultat.
 */
function verdictOnPage(mapping: RgaaMapping, page: PageScan): TestVerdict {
  if (mapping.naWhen !== undefined && (page.present[mapping.naWhen] ?? 0) === 0) return 'na';

  const counterExamples = mapping.failWhen === undefined ? undefined : page.found[mapping.failWhen];
  if (counterExamples !== undefined && counterExamples.length > 0) return 'fail';

  const rules = mapping.axeRules ?? [];
  if (rules.some(rule => page.violations.some(violation => violation.id === rule))) return 'fail';
  if (rules.some(rule => page.incomplete.includes(rule))) return 'unknown';

  const axeSatisfied = rules.length === 0 || rules.every(rule => page.passes.includes(rule));
  const selectorSatisfied = mapping.failWhen === undefined || counterExamples !== undefined;
  const somethingWasChecked = rules.length > 0 || counterExamples !== undefined;
  if (axeSatisfied && selectorSatisfied && somethingWasChecked) return 'pass';

  return 'unknown';
}

/** Verdict d'un test sur l'échantillon entier. */
function combinePages(verdicts: TestVerdict[]): TestVerdict {
  if (verdicts.length === 0) return 'unknown';
  if (verdicts.includes('fail')) return 'fail';
  if (verdicts.every(verdict => verdict === 'na')) return 'na';
  if (verdicts.every(verdict => verdict === 'na' || verdict === 'pass')) return 'pass';
  return 'unknown';
}

/**
 * Verdict d'un critère à partir de ses tests.
 *
 * Le succès exige que *chaque* test soit de présence ou de format pure. Un seul
 * test de pertinence dans le lot et le critère retombe en indéterminé : la
 * machine ne tranche pas la pertinence d'une alternative ou d'un intitulé.
 */
function combineTests(tests: Array<{ verdict: TestVerdict; provesPass: boolean }>): TestVerdict {
  if (tests.some(test => test.verdict === 'fail')) return 'fail';
  if (tests.every(test => test.verdict === 'na')) return 'na';
  if (tests.every(test => (test.verdict === 'na' || test.verdict === 'pass') && test.provesPass)) {
    return 'pass';
  }
  return 'unknown';
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

  for (const mapping of mappings) {
    const verdict = combinePages(pages.map(page => verdictOnPage(mapping, page)));

    const outcome = outcomes[mapping.criterionId] ?? {
      verdict: 'unknown' as TestVerdict,
      testVerdicts: {},
      evidence: [],
    };
    outcome.testVerdicts[mapping.testId] = verdict;

    if (verdict === 'fail') {
      for (const page of pages) {
        const nodes = mapping.failWhen === undefined ? [] : (page.found[mapping.failWhen] ?? []);
        outcome.evidence.push(...evidenceFrom(page.url, { id: mapping.testId, nodes }));

        for (const rule of mapping.axeRules ?? []) {
          const violation = page.violations.find(candidate => candidate.id === rule);
          if (violation) outcome.evidence.push(...evidenceFrom(page.url, violation));
        }
      }
    }

    outcomes[mapping.criterionId] = outcome;
  }

  for (const [criterionId, outcome] of Object.entries(outcomes)) {
    const tests = mappings
      .filter(mapping => mapping.criterionId === criterionId)
      .map(mapping => ({
        verdict: outcome.testVerdicts[mapping.testId],
        provesPass: mapping.provesPass,
      }));

    outcome.verdict = combineTests(tests);
    outcome.evidence = outcome.evidence.slice(0, EVIDENCE_MAX);
  }

  return outcomes;
}
