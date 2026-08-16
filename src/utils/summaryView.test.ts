import { describe, it, expect } from 'vitest';
import { toSummaryView } from './summaryView';
import type { SummaryStats } from './calculateSummaryStats';

const stats = (patch: Partial<SummaryStats> = {}): SummaryStats => ({
  globalRate: 50,
  conforme: 0,
  nonConforme: 0,
  nonApplicable: 0,
  notEvaluated: 0,
  defaultCompliant: 0,
  projectImplementation: 0,
  total: 0,
  byTheme: [],
  ...patch,
});

describe('toSummaryView', () => {
  // Le nombre affiché ne mesure pas la même chose selon le mode : en classique
  // une conformité, en design system une prise en charge. Un audit design system
  // annoncé « conforme à 50 % » dirait quelque chose de faux sur le site audité.
  describe('intitulé du taux', () => {
    it('parle de conformité en mode classique', () => {
      const view = toSummaryView(stats(), 'classic');

      expect(view.rateLabel).toBe('Taux de conformité');
      expect(view.rateNote).toContain('ni conformes ni non conformes');
    });

    it('parle de prise en charge en mode design system', () => {
      const view = toSummaryView(stats(), 'design-system');

      expect(view.rateLabel).toBe('Taux de prise en charge par le design system');
      expect(view.rateNote).not.toContain('conformes');
    });

    it('exclut les non applicables du calcul dans les deux modes', () => {
      expect(toSummaryView(stats(), 'classic').rateNote).toContain('non applicables');
      expect(toSummaryView(stats(), 'design-system').rateNote).toContain('non applicables');
    });
  });

  describe('compteurs', () => {
    it('distingue « évalués » de « tranchés »', () => {
      const view = toSummaryView(
        stats({ conforme: 3, nonConforme: 2, nonApplicable: 4, notEvaluated: 1, total: 10 }),
        'classic',
      );

      // Évalués inclut les non applicables, tranchés non : deux dénominateurs.
      expect(view.evaluated).toBe(9);
      expect(view.settled).toBe(5);
    });

    it('agrège les statuts des deux modes dans les mêmes seaux', () => {
      const view = toSummaryView(
        stats({ defaultCompliant: 2, projectImplementation: 3, total: 5 }),
        'design-system',
      );

      expect(view.buckets[0].count).toBe(2);
      expect(view.buckets[1].count).toBe(3);
    });
  });
});
