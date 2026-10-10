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
  const { root, naSelectors, failSelectors, snippetMax, nodesPerSelector } = options;

  const label = (element: Element): string =>
    element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');

  // Sur une zone, la zone elle-même compte : un scan de tableau doit voir son
  // tableau. Zone introuvable : plus rien n'est renseigné.
  const zone = root === undefined ? null : document.querySelector(root);
  const missing = root !== undefined && zone === null;
  const queryAll = (selector: string): Element[] => {
    if (!zone) return [...document.querySelectorAll(selector)];
    const inside = [...zone.querySelectorAll(selector)];
    return zone.matches(selector) ? [zone, ...inside] : inside;
  };

  const present: Record<string, number> = {};
  for (const selector of missing ? [] : naSelectors) {
    try {
      present[selector] = queryAll(selector).length;
    } catch {
      // Sélecteur non supporté : on ne renseigne rien.
    }
  }

  // Contrôles nommés : ce qu'un sélecteur CSS ne sait pas dire. Leur clé
  // commence par `@`, qu'aucun sélecteur valide ne commence ; une clé inconnue
  // n'est pas renseignée, comme un sélecteur qui lève.
  const named = (key: string): Array<{ selector: string; snippet: string }> | null => {
    const doctype = document.doctype;
    const shown = doctype
      ? [{ selector: 'doctype', snippet: `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}>` }]
      : [];
    switch (key) {
      case '@doctype-missing':
        return doctype ? [] : [{ selector: 'html', snippet: 'Aucune déclaration doctype' }];
      case '@doctype-invalid': {
        // HTML5, ou l'une des DTD du W3C : le RGAA valide selon le type déclaré.
        const valid =
          doctype?.name.toLowerCase() === 'html' &&
          (doctype.publicId === '' || doctype.publicId.startsWith('-//W3C//DTD '));
        return doctype && !valid ? shown : [];
      }
      case '@doctype-after-html':
        return doctype &&
          !(doctype.compareDocumentPosition(document.documentElement) & Node.DOCUMENT_POSITION_FOLLOWING)
          ? shown
          : [];
      case '@duplicate-id': {
        const seen = new Set<string>();
        return queryAll('[id]')
          .filter(element => {
            const duplicate = seen.has(element.id);
            seen.add(element.id);
            return duplicate;
          })
          .map(element => ({ selector: label(element), snippet: element.outerHTML.slice(0, snippetMax) }));
      }
      default:
        return null;
    }
  };

  const found: Record<string, Array<{ selector: string; snippet: string }>> = {};
  for (const selector of missing ? [] : failSelectors) {
    if (selector.startsWith('@')) {
      const nodes = named(selector);
      if (nodes) found[selector] = nodes.slice(0, nodesPerSelector);
      continue;
    }
    try {
      found[selector] = queryAll(selector)
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

/**
 * Récolte les liens internes de la page courante.
 *
 * **Injectée dans la page comme `probeDocument`** : même contrainte, son corps
 * se suffit à lui-même.
 *
 * Une ancre n'est pas une page : `#bas` est retiré, ce qui évite de scanner
 * quinze fois le même document. Les autres origines et les protocoles qui ne
 * sont pas du web sont écartés ici, pas plus loin.
 */
export function collectLinks(): string[] {
  const links = new Set<string>();

  for (const anchor of document.querySelectorAll('a[href]')) {
    try {
      const url = new URL((anchor as HTMLAnchorElement).href, location.href);
      if (url.origin !== location.origin) continue;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
      url.hash = '';
      links.add(url.href);
    } catch {
      // Un href que le navigateur ne sait pas résoudre n'est pas une page.
    }
  }

  return [...links];
}
