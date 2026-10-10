import { afterEach, describe, it, expect } from 'vitest';
import { collectLinks, measureReflow, probeDocument } from './collect.ts';

function mount(html: string): void {
  document.body.innerHTML = html;
}

describe('probeDocument — comptage des supports', () => {
  it('compte les éléments de chaque sélecteur de support', () => {
    mount('<table></table><table></table><iframe></iframe>');
    const result = probeDocument({
      naSelectors: ['table', 'iframe, frame', 'video'],
      failSelectors: [],
      snippetMax: 200,
      nodesPerSelector: 5,
    });

    expect(result.present).toEqual({ table: 2, 'iframe, frame': 1, video: 0 });
  });

  it('laisse un sélecteur qui lève non renseigné, jamais à zéro', () => {
    // « Vérifié, aucun résultat » et « pas vérifié » ne mènent pas au même
    // verdict : seul le premier peut conclure au non applicable.
    mount('<p>Rien</p>');
    const result = probeDocument({
      naSelectors: ['table', 'table:has(('],
      failSelectors: [],
      snippetMax: 200,
      nodesPerSelector: 5,
    });

    expect(result.present.table).toBe(0);
    expect('table:has((' in result.present).toBe(false);
  });
});

describe('probeDocument — contre-exemples', () => {
  it('récolte les contre-exemples avec leur étiquette et leur extrait', () => {
    mount('<img id="logo"><img>');
    const result = probeDocument({
      naSelectors: [],
      failSelectors: ['img:not([alt])'],
      snippetMax: 200,
      nodesPerSelector: 5,
    });

    expect(result.found['img:not([alt])']).toEqual([
      { selector: 'img#logo', snippet: '<img id="logo">' },
      { selector: 'img', snippet: '<img>' },
    ]);
  });

  it('plafonne le nombre de contre-exemples par sélecteur', () => {
    mount('<img><img><img><img>');
    const result = probeDocument({
      naSelectors: [],
      failSelectors: ['img'],
      snippetMax: 200,
      nodesPerSelector: 2,
    });

    expect(result.found['img']).toHaveLength(2);
  });

  it('tronque un extrait trop long', () => {
    mount(`<p title="${'x'.repeat(300)}">Long</p>`);
    const result = probeDocument({
      naSelectors: [],
      failSelectors: ['p'],
      snippetMax: 50,
      nodesPerSelector: 5,
    });

    expect(result.found['p'][0].snippet).toHaveLength(50);
  });

  it('laisse un sélecteur de contre-exemple qui lève non renseigné', () => {
    mount('<img>');
    const result = probeDocument({
      naSelectors: [],
      failSelectors: ['img:has(('],
      snippetMax: 200,
      nodesPerSelector: 5,
    });

    expect('img:has((' in result.found).toBe(false);
  });
});

describe('probeDocument — sérialisable pour injection', () => {
  it('ne référence aucune liaison extérieure à son corps', () => {
    // La fonction est injectée telle quelle par `frame.evaluate` (Playwright) et
    // `chrome.scripting.executeScript` (extension) : les deux la sérialisent par
    // `toString()`. Une référence au module la casserait au moment de l'exécution,
    // dans la page, loin d'ici.
    const source = probeDocument.toString();
    expect(source).not.toMatch(/\bimport\b|\brequire\b/);
    // Les compilateurs préfixent les liaisons importées ; aucune ne doit rester.
    expect(source).not.toMatch(/_[a-zA-Z]+\.\w+\(/);
  });
});

describe('probeDocument — sonde restreinte à une zone', () => {
  const options = {
    naSelectors: ['table'],
    failSelectors: ['img:not([alt])'],
    snippetMax: 200,
    nodesPerSelector: 5,
  };

  it('ne regarde que la zone demandée', () => {
    mount('<header id="head"><img></header><main><table></table><img></main>');
    const result = probeDocument({ ...options, root: '#head' });

    expect(result.present.table).toBe(0);
    expect(result.found['img:not([alt])']).toHaveLength(1);
  });

  it('compte la zone elle-même, pas seulement sa descendance', () => {
    mount('<table id="grille"><tr><td>x</td></tr></table>');
    const result = probeDocument({ ...options, root: '#grille' });

    expect(result.present.table).toBe(1);
  });

  it('ne renseigne rien si la zone a disparu', () => {
    // Zone évanouie entre le choix et le scan : « pas vérifié » et non « vide ».
    mount('<main><img></main>');
    const result = probeDocument({ ...options, root: '#absent' });

    expect(result.present).toEqual({});
    expect(result.found).toEqual({});
  });
});

describe('collectLinks', () => {
  it('ne retient que les liens de la même origine, sans ancre ni doublon', () => {
    mount(`
      <a href="/contact">Contact</a>
      <a href="/contact#bas">Le même</a>
      <a href="https://ailleurs.example/page">Ailleurs</a>
      <a href="mailto:on@exemple.fr">Courriel</a>
      <a>Sans href</a>
    `);

    expect(collectLinks()).toEqual([`${location.origin}/contact`]);
  });
});

describe('probeDocument — contrôles nommés', () => {
  const probe = (failSelectors: string[], root?: string) =>
    probeDocument({ root, naSelectors: [], failSelectors, snippetMax: 200, nodesPerSelector: 5 });

  const original = document.doctype;
  const setDoctype = (doctype: DocumentType | null) => {
    document.doctype?.remove();
    if (doctype) document.insertBefore(doctype, document.documentElement);
  };
  afterEach(() => setDoctype(original ?? document.implementation.createDocumentType('html', '', '')));

  it('un doctype html5 est présent et valide', () => {
    setDoctype(document.implementation.createDocumentType('html', '', ''));
    const { found } = probe(['@doctype-missing', '@doctype-invalid', '@doctype-after-html']);

    expect(found).toEqual({ '@doctype-missing': [], '@doctype-invalid': [], '@doctype-after-html': [] });
  });

  it('signale un doctype absent', () => {
    setDoctype(null);
    expect(probe(['@doctype-missing']).found['@doctype-missing']).toHaveLength(1);
  });

  it('accepte un doctype W3C historique, refuse un doctype inconnu', () => {
    setDoctype(document.implementation.createDocumentType('html', '-//W3C//DTD HTML 4.01//EN', ''));
    expect(probe(['@doctype-invalid']).found['@doctype-invalid']).toEqual([]);

    setDoctype(document.implementation.createDocumentType('svg', '', ''));
    const [node] = probe(['@doctype-invalid']).found['@doctype-invalid'];
    expect(node.snippet).toBe('<!DOCTYPE svg>');
  });

  it('relève chaque identifiant en double, pas sa première occurrence', () => {
    mount('<p id="a"></p><p id="a"></p><p id="b"></p><p id="a"></p>');
    const nodes = probe(['@duplicate-id']).found['@duplicate-id'];

    expect(nodes.map(node => node.selector)).toEqual(['p#a', 'p#a']);
  });

  it('cherche les doublons dans la zone scannée seulement', () => {
    mount('<header id="zone"><p id="a"></p></header><p id="a"></p>');
    expect(probe(['@duplicate-id'], '#zone').found['@duplicate-id']).toEqual([]);
  });

  it('laisse un contrôle inconnu non renseigné', () => {
    expect('@inconnu' in probe(['@inconnu']).found).toBe(false);
  });
});

describe('measureReflow — défilement horizontal à 320 px', () => {
  const options = { snippetMax: 200, nodesPerSelector: 5 };

  /** jsdom ne calcule aucune mise en page : la largeur se pose à la main. */
  function layout(pageWidth: number, rights: Record<string, number>) {
    const root = document.documentElement;
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: 320 });
    Object.defineProperty(root, 'scrollWidth', { configurable: true, value: pageWidth });
    for (const [id, right] of Object.entries(rights)) {
      const element = document.getElementById(id)!;
      element.getBoundingClientRect = () => ({ right }) as DOMRect;
    }
  }

  afterEach(() => {
    delete (document.documentElement as { clientWidth?: number }).clientWidth;
    delete (document.documentElement as { scrollWidth?: number }).scrollWidth;
  });

  it('ne relève rien quand la page tient dans la largeur', () => {
    mount('<div id="a"></div>');
    layout(320, { a: 300 });
    expect(measureReflow(options)).toEqual([]);
  });

  it('relève l’élément qui déborde le plus haut, pas ses descendants', () => {
    mount('<main id="m"><table id="t"><tr><td id="c">x</td></tr></table></main>');
    layout(900, { m: 320, t: 900, c: 900 });

    expect(measureReflow(options).map(node => node.selector)).toEqual(['table#t']);
  });

  it('écarte ce qui déborde dans un conteneur qui défile lui-même', () => {
    // Un tableau dans une zone à défilement propre ne fait pas défiler la page :
    // c'est un cas particulier que le référentiel admet.
    mount('<div id="s" style="overflow-x: auto"><table id="t"></table></div><img id="i">');
    layout(700, { s: 320, t: 900, i: 700 });

    expect(measureReflow(options).map(node => node.selector)).toEqual(['img#i']);
  });

  it('ne référence aucune liaison extérieure à son corps', () => {
    const source = measureReflow.toString();
    expect(source).not.toMatch(/\bimport\b|\brequire\b/);
    expect(source).not.toMatch(/_[a-zA-Z]+\.\w+\(/);
  });
});
