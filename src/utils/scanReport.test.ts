import { describe, it, expect } from 'vitest';
import { parseScanReport, planScanApplication } from './scanReport';
import type { CriteriaRGAA, ScanReport } from '../types';

const KNOWN = new Set(['1.1', '2.1', '5.4', '8.3', '11.1']);

// Du JSON brut de schéma 1, tel qu'il arrive du dehors : il n'a pas encore la
// forme d'un `ScanReport`, et le typer ainsi masquerait ce que la validation fait.
function report(criteria: Record<string, unknown>): string {
  return JSON.stringify({
    schema: 1,
    scannedAt: '2026-08-20T10:00:00.000Z',
    urls: ['https://exemple.fr'],
    axeVersion: '4.13.0',
    criteria,
  });
}

describe('parseScanReport', () => {
  it('accepte un rapport bien formé', () => {
    const parsed = parseScanReport(
      report({
        '2.1': {
          verdict: 'fail',
          testVerdicts: { '2.1.1': 'fail' },
          evidence: [{ url: 'https://exemple.fr', selector: 'iframe', snippet: '<iframe>' }],
        },
      }),
      KNOWN,
    );

    expect(parsed.scannedAt).toBe('2026-08-20T10:00:00.000Z');
    expect(parsed.urls).toEqual(['https://exemple.fr']);
    expect(parsed.criteria['2.1'].verdict).toBe('fail');
    expect(parsed.criteria['2.1'].evidence[0].selector).toBe('iframe');
  });

  it('accepte une preuve réduite à sa page', () => {
    const parsed = parseScanReport(
      report({ '5.4': { verdict: 'na', testVerdicts: { '5.4.1': 'na' }, evidence: [] } }),
      KNOWN,
    );
    expect(parsed.criteria['5.4'].verdict).toBe('na');
  });

  it('plafonne les preuves d’un critère', () => {
    // Un rapport vient du dehors, et finit dans localStorage : ce qu'il apporte
    // se borne ici, comme le moteur le borne à la sortie.
    const parsed = parseScanReport(
      report({
        '2.1': {
          verdict: 'fail',
          testVerdicts: { '2.1.1': 'fail' },
          evidence: Array.from({ length: 40 }, () => ({ url: 'https://exemple.fr' })),
        },
      }),
      KNOWN,
    );

    expect(parsed.criteria['2.1'].evidence).toHaveLength(3);
  });

  it('tronque un extrait démesuré', () => {
    const parsed = parseScanReport(
      report({
        '2.1': {
          verdict: 'fail',
          testVerdicts: { '2.1.1': 'fail' },
          evidence: [{ url: 'https://exemple.fr', selector: 'x'.repeat(9000), snippet: 'y'.repeat(9000) }],
        },
      }),
      KNOWN,
    );

    const [evidence] = parsed.criteria['2.1'].evidence;
    expect(evidence.snippet).toHaveLength(200);
    expect(evidence.selector?.length).toBeLessThanOrEqual(200);
  });

  it('rejette un fichier qui n’est pas du JSON', () => {
    expect(() => parseScanReport('pas du json', KNOWN)).toThrow(/JSON/i);
  });

  it('rejette un JSON qui n’est pas un rapport', () => {
    expect(() => parseScanReport('[]', KNOWN)).toThrow(/rapport de scan/i);
    expect(() => parseScanReport('null', KNOWN)).toThrow(/rapport de scan/i);
  });

  it('rejette un schéma inconnu', () => {
    const wrong = JSON.stringify({ schema: 9, scannedAt: 'x', urls: [], criteria: {} });
    expect(() => parseScanReport(wrong, KNOWN)).toThrow(/schéma/i);
  });

  it('rejette un rapport dont un champ obligatoire manque', () => {
    const missing = JSON.stringify({ schema: 1, urls: [], criteria: {} });
    expect(() => parseScanReport(missing, KNOWN)).toThrow(/scannedAt/);
  });

  it('rejette une liste d’URLs qui n’en est pas une', () => {
    const bad = JSON.stringify({ schema: 1, scannedAt: 'x', urls: 'https://exemple.fr', criteria: {} });
    expect(() => parseScanReport(bad, KNOWN)).toThrow(/urls/);
  });

  it('rejette un critère qui n’existe pas dans le référentiel', () => {
    const bad = report({ '99.9': { verdict: 'fail', testVerdicts: {}, evidence: [] } });
    expect(() => parseScanReport(bad, KNOWN)).toThrow(/99\.9/);
  });

  it('rejette un verdict inconnu', () => {
    const bad = report({ '1.1': { verdict: 'peut-être', testVerdicts: {}, evidence: [] } as never });
    expect(() => parseScanReport(bad, KNOWN)).toThrow(/verdict/i);
  });

  it('rejette une preuve sans page', () => {
    const bad = report({
      '1.1': { verdict: 'fail', testVerdicts: {}, evidence: [{ selector: 'img' } as never] },
    });
    expect(() => parseScanReport(bad, KNOWN)).toThrow(/preuve/i);
  });
});

const criteriaList: CriteriaRGAA[] = [
  { id: '1.1', title: 'Image', url: 'u', theme: 'Images', level: 'A' },
  { id: '2.1', title: 'Cadre', url: 'u', theme: 'Cadres', level: 'A' },
  { id: '5.4', title: 'Tableau', url: 'u', theme: 'Tableaux', level: 'A' },
  { id: '8.3', title: 'Langue', url: 'u', theme: 'Éléments obligatoires', level: 'A' },
];

const proven = { certainty: 'proven' } as const;

const outcomes: ScanReport['criteria'] = {
  '1.1': { ...proven, verdict: 'fail', testVerdicts: { '1.1.1': 'fail', '1.1.2': 'unknown' }, evidence: [{ url: 'p' }] },
  '2.1': { ...proven, verdict: 'na', testVerdicts: { '2.1.1': 'na' }, evidence: [] },
  '8.3': { ...proven, verdict: 'pass', testVerdicts: { '8.3.1': 'pass' }, evidence: [] },
  '5.4': { ...proven, verdict: 'unknown', testVerdicts: { '5.4.1': 'unknown' }, evidence: [] },
};

const parsed: ScanReport = {
  schema: 1,
  scannedAt: '2026-08-20T10:00:00.000Z',
  urls: ['https://exemple.fr'],
  criteria: outcomes,
};

describe('planScanApplication', () => {
  it('écrit les échecs et les non applicables prouvés', () => {
    const plan = planScanApplication(parsed, criteriaList);
    expect(plan.direct.map(entry => [entry.criteriaId, entry.status])).toEqual([
      ['1.1', 'non-conforme'],
      ['2.1', 'non-applicable'],
    ]);
  });

  it('ne propose le conforme que dans la file à confirmer', () => {
    const plan = planScanApplication(parsed, criteriaList);
    expect(plan.proposed.map(entry => entry.criteriaId)).toEqual(['8.3']);
    expect(plan.proposed[0].status).toBe('conforme');
    expect(plan.direct.some(entry => entry.criteriaId === '8.3')).toBe(false);
  });

  it('ne retient comme tests que ceux qui ont tranché', () => {
    const plan = planScanApplication(parsed, criteriaList);
    expect(plan.direct[0].testIds).toEqual(['1.1.1']);
  });

  it('compte les critères que le scan n’a pas tranchés', () => {
    // 5.4 est indéterminé, et rien n'est dit des critères absents du rapport.
    const plan = planScanApplication(parsed, [
      ...criteriaList,
      { id: '10.1', title: 'CSS', url: 'u', theme: 'Présentation', level: 'A' },
    ]);
    expect(plan.unscanned).toBe(2);
  });

  it('ignore un critère hors du périmètre de l’audit', () => {
    const plan = planScanApplication(parsed, [criteriaList[0]]);
    expect(plan.direct).toHaveLength(1);
    expect(plan.proposed).toHaveLength(0);
    expect(plan.unscanned).toBe(0);
  });
});

/**
 * Le rapport a gagné un troisième niveau de certitude. Les rapports produits
 * avant lui restent lisibles : un auditeur ne doit pas voir son travail refusé
 * parce que le moteur a évolué entre-temps.
 */
describe('parseScanReport — schéma 2 et soupçons', () => {
  const withSchema = (schema: number, verdict: string) =>
    JSON.stringify({
      schema,
      scannedAt: '2026-08-21T10:00:00.000Z',
      urls: ['https://exemple.fr'],
      criteria: { '2.1': { verdict, testVerdicts: { '2.1.1': verdict }, evidence: [] } },
    });

  it('accepte un rapport de schéma 2', () => {
    expect(parseScanReport(withSchema(2, 'fail'), KNOWN).criteria['2.1'].verdict).toBe('fail');
  });

  it('accepte encore un rapport de schéma 1', () => {
    expect(parseScanReport(withSchema(1, 'na'), KNOWN).criteria['2.1'].verdict).toBe('na');
  });

  it('relit un « suspect » de schéma 2 en échec probable', () => {
    const parsed = parseScanReport(withSchema(2, 'suspect'), KNOWN);
    expect(parsed.criteria['2.1'].verdict).toBe('fail');
    expect(parsed.criteria['2.1'].certainty).toBe('probable');
    expect(parsed.criteria['2.1'].testVerdicts['2.1.1']).toBe('fail');
  });

  it('tient un verdict sans certitude pour prouvé', () => {
    expect(parseScanReport(withSchema(2, 'fail'), KNOWN).criteria['2.1'].certainty).toBe('proven');
  });

  it('conserve le schéma du rapport reçu', () => {
    expect(parseScanReport(withSchema(1, 'fail'), KNOWN).schema).toBe(1);
    expect(parseScanReport(withSchema(2, 'fail'), KNOWN).schema).toBe(2);
  });

  it("n'écrit jamais un soupçon sans confirmation humaine", () => {
    const parsed = parseScanReport(withSchema(2, 'suspect'), KNOWN);
    const criteria: CriteriaRGAA[] = [
      { id: '2.1', title: 'Cadres', url: 'u', theme: 'Cadres', level: 'A' },
    ];
    const plan = planScanApplication(parsed, criteria);
    expect(plan.direct).toEqual([]);
  });
});

/**
 * Le tri par certitude. Trois tas, trois traitements : ce qui est prouvé
 * s'écrit, ce qui est soupçonné se propose, ce qui n'a pas été regardé se
 * compte. Confondre les deux premiers rendrait le pré-remplissage indéfendable
 * devant une déclaration d'accessibilité.
 */
describe('planScanApplication — tri par certitude', () => {
  const criteria: CriteriaRGAA[] = [
    { id: '1.1', title: 'Images', url: 'u', theme: 'Images', level: 'A' },
    { id: '2.1', title: 'Cadres', url: 'u', theme: 'Cadres', level: 'A' },
    { id: '5.4', title: 'Tableaux', url: 'u', theme: 'Tableaux', level: 'A' },
    { id: '8.3', title: 'Langue', url: 'u', theme: 'Éléments obligatoires', level: 'A' },
  ];

  const parsed = () =>
    parseScanReport(
      JSON.stringify({
        schema: 2,
        scannedAt: '2026-08-21T10:00:00.000Z',
        urls: ['https://exemple.fr'],
        criteria: {
          '2.1': { verdict: 'fail', testVerdicts: { '2.1.1': 'fail' }, evidence: [] },
          '5.4': { verdict: 'na', testVerdicts: { '5.4.1': 'na' }, evidence: [] },
          '1.1': {
            verdict: 'suspect',
            testVerdicts: { '1.1.5': 'suspect' },
            evidence: [{ url: 'https://exemple.fr', selector: 'svg' }],
          },
          '8.3': { verdict: 'pass', testVerdicts: { '8.3.1': 'pass' }, evidence: [] },
        },
      }),
      KNOWN,
    );

  it('sépare le soupçon de la preuve et du conforme proposé', () => {
    const plan = planScanApplication(parsed(), criteria);

    expect(plan.direct.map(entry => entry.criteriaId)).toEqual(['2.1', '5.4']);
    expect(plan.probable.map(entry => entry.criteriaId)).toEqual(['1.1']);
    expect(plan.proposed.map(entry => entry.criteriaId)).toEqual(['8.3']);
    expect(plan.unscanned).toBe(0);
  });

  it('propose un soupçon en non conforme, jamais en conforme', () => {
    expect(planScanApplication(parsed(), criteria).probable[0].status).toBe('non-conforme');
  });

  it('marque le soupçon pour que sa provenance ne se fasse pas passer pour une preuve', () => {
    const plan = planScanApplication(parsed(), criteria);
    expect(plan.probable[0].fromHint).toBe(true);
    expect(plan.direct.every(entry => !entry.fromHint)).toBe(true);
  });

  it('joint la preuve du soupçon, pour qu’il soit instruisible', () => {
    const plan = planScanApplication(parsed(), criteria);
    expect(plan.probable[0].evidence).toEqual([{ url: 'https://exemple.fr', selector: 'svg' }]);
  });

  it('ne compte pas un soupçon parmi les critères non évalués', () => {
    const plan = planScanApplication(parsed(), criteria);
    expect(plan.unscanned).toBe(0);
  });
});

/**
 * Le schéma 3 sépare le verdict de sa certitude. Ce qui compte ici : un non
 * applicable probable se propose comme non applicable, jamais comme non
 * conforme — c'est exactement l'erreur qu'un troisième verdict aurait produite.
 */
describe('parseScanReport — schéma 3, verdict et certitude', () => {
  const criteria: CriteriaRGAA[] = [
    { id: '2.1', title: 'Cadres', url: 'u', theme: 'Cadres', level: 'A' },
    { id: '11.1', title: 'Champs', url: 'u', theme: 'Formulaires', level: 'A' },
  ];

  const report3 = (verdict: string, certainty: string) =>
    JSON.stringify({
      schema: 3,
      scannedAt: '2026-08-21T10:00:00.000Z',
      urls: ['https://exemple.fr'],
      criteria: {
        '11.1': { verdict, certainty, testVerdicts: { '11.1.1': verdict }, evidence: [] },
      },
    });

  it('accepte un rapport de schéma 3', () => {
    const parsed = parseScanReport(report3('na', 'probable'), KNOWN);
    expect(parsed.schema).toBe(3);
    expect(parsed.criteria['11.1']).toMatchObject({ verdict: 'na', certainty: 'probable' });
  });

  it('refuse une certitude inconnue', () => {
    expect(() => parseScanReport(report3('na', 'peut-être'), KNOWN)).toThrow(/certitude/i);
  });

  it('propose un non applicable probable en non applicable, jamais en non conforme', () => {
    const plan = planScanApplication(parseScanReport(report3('na', 'probable'), KNOWN), criteria);
    expect(plan.direct).toEqual([]);
    expect(plan.probable.map(entry => entry.status)).toEqual(['non-applicable']);
    expect(plan.probable[0].fromHint).toBe(true);
  });

  it('écrit directement un non applicable prouvé', () => {
    const plan = planScanApplication(parseScanReport(report3('na', 'proven'), KNOWN), criteria);
    expect(plan.direct.map(entry => entry.status)).toEqual(['non-applicable']);
    expect(plan.probable).toEqual([]);
  });

  it('ne propose jamais un conforme probable en écriture directe', () => {
    const plan = planScanApplication(parseScanReport(report3('pass', 'probable'), KNOWN), criteria);
    expect(plan.direct).toEqual([]);
    expect(plan.proposed.map(entry => entry.status)).toEqual(['conforme']);
  });
});

describe('parseScanReport — rapport de zone', () => {
  // Un rapport de zone porte les sélecteurs sur lesquels le scan a réellement
  // porté. Le reste de la page n'a pas été regardé.
  function zoneReport(zones: unknown, criteria: Record<string, unknown>): string {
    return JSON.stringify({
      schema: 3,
      scannedAt: '2026-08-21T10:00:00.000Z',
      urls: ['https://exemple.fr'],
      zones,
      criteria,
    });
  }

  const notApplicable = {
    '5.4': {
      verdict: 'na',
      certainty: 'proven',
      testVerdicts: { '5.4.1': 'na' },
      evidence: [],
    },
  };

  it('retient les zones scannées', () => {
    const parsed = parseScanReport(zoneReport(['#header'], notApplicable), KNOWN);
    expect(parsed.zones).toEqual(['#header']);
  });

  it('dégrade tout non applicable de zone en probable', () => {
    const parsed = parseScanReport(zoneReport(['#header'], notApplicable), KNOWN);

    expect(parsed.criteria['5.4'].verdict).toBe('na');
    expect(parsed.criteria['5.4'].certainty).toBe('probable');
  });

  it('n’écrit donc jamais un non applicable issu d’une zone', () => {
    const parsed = parseScanReport(zoneReport(['#header'], notApplicable), KNOWN);
    const plan = planScanApplication(parsed, [{ id: '5.4' } as CriteriaRGAA]);

    expect(plan.direct).toEqual([]);
    expect(plan.probable.map(entry => entry.criteriaId)).toEqual(['5.4']);
  });

  it('laisse un échec prouvé de zone tel quel : un contre-exemple reste un contre-exemple', () => {
    const parsed = parseScanReport(
      zoneReport(['#header'], {
        '2.1': {
          verdict: 'fail',
          certainty: 'proven',
          testVerdicts: { '2.1.1': 'fail' },
          evidence: [{ url: 'https://exemple.fr' }],
        },
      }),
      KNOWN,
    );

    expect(parsed.criteria['2.1'].certainty).toBe('proven');
  });

  it('rejette une liste de zones qui n’en est pas une', () => {
    expect(() => parseScanReport(zoneReport([{ selector: '#header' }], notApplicable), KNOWN)).toThrow(
      /zones/,
    );
  });

  it('lit un rapport sans zones comme un rapport de pages', () => {
    const parsed = parseScanReport(zoneReport(undefined, notApplicable), KNOWN);

    expect(parsed.zones).toBeUndefined();
    expect(parsed.criteria['5.4'].certainty).toBe('proven');
  });
});

describe('parseScanReport — rapport de crawl', () => {
  function crawlReport(crawled: unknown): string {
    return JSON.stringify({
      schema: 3,
      scannedAt: '2026-08-21T10:00:00.000Z',
      urls: ['https://exemple.fr'],
      crawled,
      criteria: {
        '5.4': { verdict: 'na', certainty: 'proven', testVerdicts: { '5.4.1': 'na' }, evidence: [] },
      },
    });
  }

  it('dégrade le non applicable d’un crawl : personne n’a manipulé ces pages', () => {
    const parsed = parseScanReport(crawlReport(true), KNOWN);

    expect(parsed.crawled).toBe(true);
    expect(parsed.criteria['5.4'].certainty).toBe('probable');
  });

  it('n’écrit donc rien d’un non applicable de crawl', () => {
    const parsed = parseScanReport(crawlReport(true), KNOWN);
    const plan = planScanApplication(parsed, [{ id: '5.4' } as CriteriaRGAA]);

    expect(plan.direct).toEqual([]);
    expect(plan.probable.map(entry => entry.criteriaId)).toEqual(['5.4']);
  });

  it('rejette un champ « crawled » qui n’est pas un booléen', () => {
    expect(() => parseScanReport(crawlReport('oui'), KNOWN)).toThrow(/crawled/);
  });
});
