// Les imports de ce dossier portent leur extension `.ts` : `src/scripts/scan.ts`
// est exécuté par Node directement, et la résolution ESM de Node exige un
// spécificateur complet.
import type { ProbeOptions, ProbeResult } from './types.ts';

/**
 * Compte les supports et récolte les contre-exemples dans le document courant.
 *
 * **Cette fonction est injectée dans la page, pas appelée depuis ici.**
 * Playwright (`frame.evaluate`) et l'extension (`chrome.scripting.executeScript`)
 * la sérialisent toutes deux par `toString()` : son corps doit donc se suffire
 * à lui-même. Aucun import, aucune constante de module, aucun utilitaire
 * extérieur — tout ce dont elle a besoin arrive par `options` ou vit dans son
 * corps. Un test tient cet invariant, parce que le casser ne se verrait qu'à
 * l'exécution, dans la page, loin d'ici.
 *
 * Un sélecteur qui lève — syntaxe non supportée par le navigateur — n'est
 * simplement pas renseigné. C'est voulu : le moteur distingue « vérifié, aucun
 * contre-exemple » de « pas vérifié », et seul le premier peut mener au succès
 * ou au non applicable.
 */
export function probeDocument(options: ProbeOptions): ProbeResult {
  const { naSelectors, failSelectors, snippetMax, nodesPerSelector } = options;

  const label = (element: Element): string =>
    element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');

  const present: Record<string, number> = {};
  for (const selector of naSelectors) {
    try {
      present[selector] = document.querySelectorAll(selector).length;
    } catch {
      // Sélecteur non supporté : on ne renseigne rien.
    }
  }

  const found: Record<string, Array<{ selector: string; snippet: string }>> = {};
  for (const selector of failSelectors) {
    try {
      found[selector] = [...document.querySelectorAll(selector)]
        .slice(0, nodesPerSelector)
        .map(element => ({
          selector: label(element),
          snippet: element.outerHTML.slice(0, snippetMax),
        }));
    } catch {
      // Idem : un sélecteur qui lève n'est pas un sélecteur sans résultat.
    }
  }

  return { present, found };
}
