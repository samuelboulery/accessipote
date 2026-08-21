/**
 * Choisir une zone à la souris, dans la page réelle.
 *
 * Le popup se ferme dès que l'auditeur clique dans la page : c'est le service
 * worker qui pilote ce geste, et lui seul survit à la fermeture.
 */

/**
 * Injectée dans la page, donc sérialisée par `toString()` : son corps se suffit
 * à lui-même — aucun import, aucune constante de module.
 *
 * Rend le sélecteur de l'élément cliqué, ou `null` si l'auditeur renonce.
 */
function pickInPage(): Promise<string | null> {
  return new Promise(resolve => {
    const outline = document.createElement('div');
    outline.style.cssText =
      'position:fixed;z-index:2147483647;pointer-events:none;outline:2px solid #b3261e;' +
      'background:rgba(179,38,30,0.08);transition:all 60ms';
    document.documentElement.append(outline);

    let hovered: Element | null = null;

    /** Un chemin qui retrouve l'élément, et rien d'autre : id si possible, sinon rang. */
    const selectorOf = (element: Element): string => {
      const parts: string[] = [];
      let node: Element | null = element;
      while (node && node !== document.documentElement) {
        if (node.id) {
          parts.unshift(`#${CSS.escape(node.id)}`);
          break;
        }
        const parent: Element | null = node.parentElement;
        if (!parent) break;
        const kin = [...parent.children].filter(child => child.tagName === node!.tagName);
        const name = node.tagName.toLowerCase();
        parts.unshift(kin.length > 1 ? `${name}:nth-of-type(${kin.indexOf(node) + 1})` : name);
        node = parent;
      }
      return parts.join(' > ');
    };

    const move = (event: MouseEvent) => {
      const element = event.target as Element | null;
      if (!element || element === outline) return;
      hovered = element;
      const box = element.getBoundingClientRect();
      outline.style.top = `${box.top}px`;
      outline.style.left = `${box.left}px`;
      outline.style.width = `${box.width}px`;
      outline.style.height = `${box.height}px`;
    };

    const stop = (selector: string | null) => {
      document.removeEventListener('mousemove', move, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key, true);
      outline.remove();
      resolve(selector);
    };

    // Le clic sert à choisir, pas à naviguer : la page ne doit pas le recevoir.
    const click = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      stop(hovered ? selectorOf(hovered) : null);
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop(null);
    };

    document.addEventListener('mousemove', move, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
  });
}

/** Rend le sélecteur choisi dans cet onglet, ou `null` si l'auditeur renonce. */
export async function pickZone(tabId: number): Promise<string | null> {
  const [picked] = await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    func: pickInPage,
  });
  return (picked?.result as string | null) ?? null;
}
