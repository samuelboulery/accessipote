import { describe, it, expect } from 'vitest';
import { aggregate } from './aggregate.ts';
import type { PageScan, RgaaMapping } from './types.ts';

const page = (url: string, over: Partial<PageScan> = {}): PageScan => ({
  url,
  violations: [],
  incomplete: [],
  passes: [],
  present: {},
  found: {},
  ...over,
});

const FRAME: RgaaMapping = {
  testId: '2.1.1',
  criterionId: '2.1',
  axeRules: ['frame-title'],
  naWhen: 'iframe',
  provesPass: true,
};

describe('aggregate — échec', () => {
  it('une violation sur une seule page met le critère en échec', () => {
    const pages = [
      page('/a', { present: { iframe: 1 }, passes: ['frame-title'] }),
      page('/b', {
        present: { iframe: 1 },
        violations: [{ id: 'frame-title', nodes: [{ selector: 'iframe', snippet: '<iframe>' }] }],
      }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('fail');
  });

  it("l'échec l'emporte sur le non applicable des autres pages", () => {
    const pages = [
      page('/a', { present: { iframe: 0 } }),
      page('/b', {
        present: { iframe: 1 },
        violations: [{ id: 'frame-title', nodes: [{ selector: 'iframe', snippet: '<iframe>' }] }],
      }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('fail');
  });

  it('joint la preuve : page, sélecteur et extrait', () => {
    const pages = [
      page('https://ex.fr/b', {
        present: { iframe: 1 },
        violations: [{ id: 'frame-title', nodes: [{ selector: 'iframe#pub', snippet: '<iframe id="pub">' }] }],
      }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].evidence).toEqual([
      { url: 'https://ex.fr/b', selector: 'iframe#pub', snippet: '<iframe id="pub">' },
    ]);
  });

  it('plafonne les preuves à trois par critère', () => {
    const nodes = Array.from({ length: 10 }, (_, i) => ({ selector: `iframe:nth-child(${i})`, snippet: '<iframe>' }));
    const pages = [page('/a', { present: { iframe: 10 }, violations: [{ id: 'frame-title', nodes }] })];
    expect(aggregate(pages, [FRAME])['2.1'].evidence).toHaveLength(3);
  });

  it('tronque les extraits à 200 caractères', () => {
    const snippet = '<iframe>'.padEnd(500, 'x');
    const pages = [
      page('/a', {
        present: { iframe: 1 },
        violations: [{ id: 'frame-title', nodes: [{ selector: 'iframe', snippet }] }],
      }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].evidence[0].snippet).toHaveLength(200);
  });
});

describe('aggregate — non applicable', () => {
  it("l'absence sur toutes les pages rend le critère non applicable", () => {
    const pages = [page('/a', { present: { iframe: 0 } }), page('/b', { present: { iframe: 0 } })];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('na');
  });

  it("une seule page porteuse suffit à rendre le critère applicable", () => {
    const pages = [
      page('/a', { present: { iframe: 0 } }),
      page('/b', { present: { iframe: 1 }, passes: ['frame-title'] }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('pass');
  });

  it("le non applicable d'axe n'en est pas un : sans sélecteur, pas de NA", () => {
    const sansSelecteur: RgaaMapping = { ...FRAME, naWhen: undefined };
    const pages = [page('/a'), page('/b')];
    expect(aggregate(pages, [sansSelecteur])['2.1'].verdict).toBe('unknown');
  });
});

describe('aggregate — conforme', () => {
  it('un test de présence pure passé partout vaut conforme', () => {
    const pages = [
      page('/a', { present: { iframe: 2 }, passes: ['frame-title'] }),
      page('/b', { present: { iframe: 1 }, passes: ['frame-title'] }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('pass');
  });

  it("un test de pertinence passé partout ne vaut jamais conforme", () => {
    const pertinence: RgaaMapping = { ...FRAME, testId: '2.2.1', criterionId: '2.2', provesPass: false };
    const pages = [page('/a', { present: { iframe: 1 }, passes: ['frame-title'] })];
    expect(aggregate(pages, [pertinence])['2.2'].verdict).toBe('unknown');
  });

  it('un critère à plusieurs tests exige que tous prouvent leur succès', () => {
    const mapping: RgaaMapping[] = [
      { testId: '5.7.1', criterionId: '5.7', axeRules: ['scope-attr-valid'], naWhen: 'table', provesPass: true },
      { testId: '5.7.2', criterionId: '5.7', axeRules: ['td-headers-attr'], naWhen: 'table', provesPass: false },
    ];
    const pages = [page('/a', { present: { table: 1 }, passes: ['scope-attr-valid', 'td-headers-attr'] })];
    expect(aggregate(pages, mapping)['5.7'].verdict).toBe('unknown');
  });
});

describe('aggregate — indéterminé', () => {
  it("un `incomplete` d'axe ne prouve rien, ni échec ni succès", () => {
    const pages = [page('/a', { present: { iframe: 1 }, incomplete: ['frame-title'] })];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('unknown');
  });

  it("un `incomplete` sur une page annule le succès des autres", () => {
    const pages = [
      page('/a', { present: { iframe: 1 }, passes: ['frame-title'] }),
      page('/b', { present: { iframe: 1 }, incomplete: ['frame-title'] }),
    ];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('unknown');
  });

  it("une règle ni passée ni violée ne prouve pas le succès", () => {
    const pages = [page('/a', { present: { iframe: 1 } })];
    expect(aggregate(pages, [FRAME])['2.1'].verdict).toBe('unknown');
  });

  it('sans aucune page, rien ne se prouve', () => {
    expect(aggregate([], [FRAME])['2.1'].verdict).toBe('unknown');
  });
});

describe('aggregate — détail par test', () => {
  it('expose le verdict de chaque test du critère', () => {
    const mapping: RgaaMapping[] = [
      { testId: '5.7.1', criterionId: '5.7', axeRules: ['scope-attr-valid'], naWhen: 'table', provesPass: true },
      { testId: '5.7.2', criterionId: '5.7', axeRules: ['td-headers-attr'], naWhen: 'table', provesPass: true },
    ];
    const pages = [
      page('/a', {
        present: { table: 1 },
        passes: ['scope-attr-valid'],
        violations: [{ id: 'td-headers-attr', nodes: [{ selector: 'td', snippet: '<td>' }] }],
      }),
    ];
    expect(aggregate(pages, mapping)['5.7'].testVerdicts).toEqual({ '5.7.1': 'pass', '5.7.2': 'fail' });
  });
});

const TITLE: RgaaMapping = {
  testId: '2.1.1',
  criterionId: '2.1',
  failWhen: 'iframe:not([title])',
  naWhen: 'iframe',
  provesPass: true,
};

describe('aggregate — contre-exemple par sélecteur', () => {
  it('un élément trouvé prouve l\'échec', () => {
    const pages = [
      page('/a', {
        present: { iframe: 1 },
        found: { 'iframe:not([title])': [{ selector: 'iframe#pub', snippet: '<iframe id="pub">' }] },
      }),
    ];
    const outcome = aggregate(pages, [TITLE])['2.1'];
    expect(outcome.verdict).toBe('fail');
    expect(outcome.evidence).toEqual([
      { url: '/a', selector: 'iframe#pub', snippet: '<iframe id="pub">' },
    ]);
  });

  it('aucun contre-exemple, support présent : le test passe', () => {
    const pages = [
      page('/a', { present: { iframe: 2 }, found: { 'iframe:not([title])': [] } }),
      page('/b', { present: { iframe: 1 }, found: { 'iframe:not([title])': [] } }),
    ];
    expect(aggregate(pages, [TITLE])['2.1'].verdict).toBe('pass');
  });

  it("le sélecteur non évalué sur une page ne vaut pas absence de contre-exemple", () => {
    const pages = [page('/a', { present: { iframe: 1 } })];
    expect(aggregate(pages, [TITLE])['2.1'].verdict).toBe('unknown');
  });

  it("l'absence du support l'emporte : non applicable, pas conforme", () => {
    const pages = [page('/a', { present: { iframe: 0 }, found: { 'iframe:not([title])': [] } })];
    expect(aggregate(pages, [TITLE])['2.1'].verdict).toBe('na');
  });

  it('un contre-exemple sur une page suffit malgré le succès des autres', () => {
    const pages = [
      page('/a', { present: { iframe: 1 }, found: { 'iframe:not([title])': [] } }),
      page('/b', {
        present: { iframe: 1 },
        found: { 'iframe:not([title])': [{ selector: 'iframe', snippet: '<iframe>' }] },
      }),
    ];
    expect(aggregate(pages, [TITLE])['2.1'].verdict).toBe('fail');
  });

  it('un test sans axe ni sélecteur reste indéterminé', () => {
    const nu: RgaaMapping = { testId: '1.1.5', criterionId: '1.1', naWhen: 'svg', provesPass: false };
    const pages = [page('/a', { present: { svg: 1 } })];
    expect(aggregate(pages, [nu])['1.1'].verdict).toBe('unknown');
  });
});
