import type { AxeRuleResult, FrameScan, PageScan, ProbeResult } from './types.ts';

/**
 * Réunit ce que chaque cadre a rapporté en un seul résultat de page.
 *
 * Le RGAA raisonne par page, pas par cadre : un `<iframe>` fait partie de la
 * page qui l'embarque. La CLI et l'extension récoltent toutes deux cadre par
 * cadre, et arrivent ici avec la même matière.
 *
 * Fusionner n'est pas anodin : additionner des supports absents produirait des
 * zéros qui n'ont jamais été mesurés, et un zéro non mesuré conclut au non
 * applicable. Un sélecteur qu'aucun cadre n'a su évaluer reste donc absent.
 */
export function mergePageScan(
  url: string,
  frames: FrameScan[],
  mainFrameProbe?: ProbeResult,
): PageScan {
  const violations = mergeRules(frames.flatMap(frame => frame.violations));
  const incomplete = mergeRules(frames.flatMap(frame => frame.incomplete));
  const passes = [...new Set(frames.flatMap(frame => frame.passes))];

  const present: Record<string, number> = {};
  for (const frame of frames) {
    for (const [selector, count] of Object.entries(frame.present)) {
      present[selector] = (present[selector] ?? 0) + count;
    }
  }

  const found: Record<string, Array<{ selector: string; snippet: string }>> = {};
  for (const frame of frames) {
    for (const [selector, nodes] of Object.entries(frame.found)) {
      found[selector] = [...(found[selector] ?? []), ...nodes];
    }
  }

  // Les critères « dans chaque page web » — langue par défaut, titre de page —
  // portent sur le document principal seul. Ce qu'il rapporte fait autorité.
  Object.assign(found, mainFrameProbe?.found ?? {});

  return { url, violations, incomplete, passes, present, found };
}

/** Une même règle vue dans plusieurs cadres reste une règle, avec toutes ses occurrences. */
function mergeRules(rules: AxeRuleResult[]): AxeRuleResult[] {
  const byId = new Map<string, AxeRuleResult>();
  for (const rule of rules) {
    const existing = byId.get(rule.id);
    if (existing) existing.nodes.push(...rule.nodes);
    else byId.set(rule.id, { id: rule.id, nodes: [...rule.nodes] });
  }
  return [...byId.values()];
}
