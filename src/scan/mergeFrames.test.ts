import { describe, it, expect } from 'vitest';
import { mergePageScan } from './mergeFrames.ts';
import type { FrameScan } from './types.ts';

const frame = (over: Partial<FrameScan> = {}): FrameScan => ({
  violations: [],
  incomplete: [],
  passes: [],
  present: {},
  found: {},
  ...over,
});

describe('mergePageScan — supports', () => {
  it('additionne les supports trouvés dans chaque cadre', () => {
    const page = mergePageScan('https://ex.fr', [
      frame({ present: { table: 2 } }),
      frame({ present: { table: 3 } }),
    ]);

    expect(page.present.table).toBe(5);
  });

  it('laisse absent un sélecteur qu’aucun cadre n’a su évaluer', () => {
    // Un sélecteur non évalué n'est pas un sélecteur à zéro : il ne doit jamais
    // conclure au non applicable.
    const page = mergePageScan('https://ex.fr', [frame({ present: { table: 0 } })]);

    expect(page.present.table).toBe(0);
    expect('video' in page.present).toBe(false);
  });

  it('compte un support qu’un seul cadre a su évaluer', () => {
    const page = mergePageScan('https://ex.fr', [frame({ present: { table: 1 } }), frame()]);

    expect(page.present.table).toBe(1);
  });
});

describe('mergePageScan — résultats axe', () => {
  it('réunit les occurrences d’une même règle violée dans plusieurs cadres', () => {
    const page = mergePageScan('https://ex.fr', [
      frame({ violations: [{ id: 'label', nodes: [{ selector: 'input#a', snippet: '<input id="a">' }] }] }),
      frame({ violations: [{ id: 'label', nodes: [{ selector: 'input#b', snippet: '<input id="b">' }] }] }),
    ]);

    expect(page.violations).toHaveLength(1);
    expect(page.violations[0].nodes.map(node => node.selector)).toEqual(['input#a', 'input#b']);
  });

  it('réunit de même les règles indéterminées', () => {
    const page = mergePageScan('https://ex.fr', [
      frame({ incomplete: [{ id: 'color-contrast', nodes: [{ selector: 'p', snippet: '<p>' }] }] }),
      frame({ incomplete: [{ id: 'color-contrast', nodes: [] }] }),
    ]);

    expect(page.incomplete).toHaveLength(1);
    expect(page.incomplete[0].nodes).toHaveLength(1);
  });

  it('ne retient une règle passée qu’une fois', () => {
    const page = mergePageScan('https://ex.fr', [
      frame({ passes: ['frame-title'] }),
      frame({ passes: ['frame-title', 'label'] }),
    ]);

    expect(page.passes.sort()).toEqual(['frame-title', 'label']);
  });
});

describe('mergePageScan — contre-exemples', () => {
  it('concatène les contre-exemples de tous les cadres', () => {
    const page = mergePageScan('https://ex.fr', [
      frame({ found: { 'img:not([alt])': [{ selector: 'img#a', snippet: '<img id="a">' }] } }),
      frame({ found: { 'img:not([alt])': [{ selector: 'img#b', snippet: '<img id="b">' }] } }),
    ]);

    expect(page.found['img:not([alt])'].map(node => node.selector)).toEqual(['img#a', 'img#b']);
  });

  it('réserve au document principal ce qui ne vaut que pour lui', () => {
    // Le `<head>` d'un cadre embarqué n'est pas le titre de la page auditée :
    // sans cette réserve, un `<iframe>` ferait échouer le critère 8.5 d'une
    // page qui a pourtant le sien.
    const page = mergePageScan(
      'https://ex.fr',
      [frame({ found: { 'html:not([lang])': [{ selector: 'html', snippet: '<html>' }] } })],
      { present: {}, found: { 'html:not([lang])': [] } },
    );

    expect(page.found['html:not([lang])']).toEqual([]);
  });
});

describe('mergePageScan — page', () => {
  it('porte son adresse', () => {
    expect(mergePageScan('https://ex.fr/contact', [frame()]).url).toBe('https://ex.fr/contact');
  });

  it('reste lisible sans aucun cadre exploitable', () => {
    const page = mergePageScan('https://ex.fr', []);

    expect(page).toEqual({
      url: 'https://ex.fr',
      violations: [],
      incomplete: [],
      passes: [],
      present: {},
      found: {},
    });
  });
});
