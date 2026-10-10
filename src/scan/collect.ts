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

/**
 * Relève ce qui fait défiler la page horizontalement, à la largeur courante.
 *
 * **Injectée dans la page comme `probeDocument`** : même contrainte, son corps
 * se suffit à lui-même. Le pilote réduit d'abord la fenêtre à 320 px — c'est
 * lui qui donne son sens à la mesure, d'où son absence de l'extension.
 *
 * Seul l'élément le plus haut qui déborde est retenu : ses descendants
 * débordent avec lui. Ce qui déborde dans un conteneur à défilement propre ne
 * fait pas défiler la page, et le référentiel admet ce cas.
 */
export function measureReflow(options: {
  snippetMax: number;
  nodesPerSelector: number;
}): Array<{ selector: string; snippet: string }> {
  const root = document.documentElement;
  const width = root.clientWidth;
  if (root.scrollWidth <= width) return [];

  const overflows = (element: Element): boolean => element.getBoundingClientRect().right > width + 1;
  const scrollsItself = (element: Element): boolean =>
    ['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(element).overflowX);

  const offenders: Element[] = [];
  for (const element of document.body.querySelectorAll('*')) {
    if (offenders.length >= options.nodesPerSelector) break;
    if (!overflows(element)) continue;

    let ancestor = element.parentElement;
    while (ancestor && ancestor !== document.body && !overflows(ancestor) && !scrollsItself(ancestor)) {
      ancestor = ancestor.parentElement;
    }
    if (ancestor === null || ancestor === document.body) offenders.push(element);
  }

  // La page défile sans coupable désigné — marge, pseudo-élément : le constat
  // reste, sans quoi l'absence de coupable passerait pour une absence de défilement.
  if (offenders.length === 0) {
    return [{ selector: 'html', snippet: `La page défile horizontalement : ${root.scrollWidth} px pour ${width}.` }];
  }

  return offenders.map(element => ({
    selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
    snippet: element.outerHTML.slice(0, options.snippetMax),
  }));
}

/**
 * Regarde si l'élément qui a le focus le montre.
 *
 * **Injectée dans la page comme `probeDocument`**, après chaque appui sur Tab
 * du pilote : même contrainte, son corps se suffit à lui-même.
 *
 * Le style calculé de l'élément focalisé est comparé à celui du même élément
 * sans le focus, puis le focus lui est rendu pour que la tabulation reprenne
 * d'où elle était. Aucune différence : la prise de focus est soupçonnée
 * invisible — un indicateur porté par un parent ou un pseudo-élément échappe à
 * la comparaison, d'où le soupçon et non la preuve.
 *
 * `done` dit au pilote d'arrêter : le focus est revenu au document, ou repasse
 * sur un élément déjà vu.
 */
export function inspectFocus(options: { snippetMax: number }): {
  done: boolean;
  invisible: { selector: string; snippet: string } | null;
} {
  const element = document.activeElement;
  if (!element || element === document.body || element === document.documentElement) {
    return { done: true, invisible: null };
  }

  // Le registre vit sur la fenêtre, pas dans le DOM : marquer les éléments
  // changerait les extraits rapportés.
  const registry = window as unknown as { accessipoteFocusSeen?: WeakSet<Element> };
  registry.accessipoteFocusSeen ??= new WeakSet();
  if (registry.accessipoteFocusSeen.has(element)) return { done: true, invisible: null };
  registry.accessipoteFocusSeen.add(element);

  // Un cadre garde son focus pour lui : ce qu'il contient n'est pas regardé ici.
  if (element.tagName === 'IFRAME' || element.tagName === 'FRAME') return { done: false, invisible: null };

  const properties = [
    'outline-style',
    'outline-width',
    'outline-color',
    'box-shadow',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'background-color',
    'color',
    'text-decoration-line',
  ];
  const snapshot = (): string =>
    properties.map(property => getComputedStyle(element).getPropertyValue(property)).join('|');

  const focused = snapshot();
  (element as HTMLElement).blur();
  const unfocused = snapshot();
  (element as HTMLElement).focus({ preventScroll: true });

  if (focused !== unfocused) return { done: false, invisible: null };
  return {
    done: false,
    invisible: {
      selector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
      snippet: element.outerHTML.slice(0, options.snippetMax),
    },
  };
}
