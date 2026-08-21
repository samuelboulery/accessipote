import { describe, it, expect } from 'vitest';
import { parseScanReport, planScanApplication } from './scanReport';
import type { CriteriaRGAA, ScanReport } from '../types';

const KNOWN = new Set(['1.1', '2.1', '5.4', '8.3']);

function report(criteria: ScanReport['criteria']): string {
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

const outcomes: ScanReport['criteria'] = {
  '1.1': { verdict: 'fail', testVerdicts: { '1.1.1': 'fail', '1.1.2': 'unknown' }, evidence: [{ url: 'p' }] },
  '2.1': { verdict: 'na', testVerdicts: { '2.1.1': 'na' }, evidence: [] },
  '8.3': { verdict: 'pass', testVerdicts: { '8.3.1': 'pass' }, evidence: [] },
  '5.4': { verdict: 'unknown', testVerdicts: { '5.4.1': 'unknown' }, evidence: [] },
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

  it('accepte le verdict « suspect »', () => {
    const parsed = parseScanReport(withSchema(2, 'suspect'), KNOWN);
    expect(parsed.criteria['2.1'].verdict).toBe('suspect');
    expect(parsed.criteria['2.1'].testVerdicts['2.1.1']).toBe('suspect');
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
