import { describe, it, expect } from 'vitest';
import type { CriteriaRGAA, Progress } from '../types';
import { calculateSummaryStats } from './calculateSummaryStats';

// Helper to create mock criteria
const createMockCriteria = (id: string, theme: string): CriteriaRGAA => ({
  id,
  title: `Test Criteria ${id}`,
  url: 'https://example.com',
  theme,
  level: 'A',
});

describe('calculateSummaryStats', () => {
  describe('Empty progress', () => {
    it('should return all zeros and null rate when no criteria have status', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress['classic'] = {};

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.conforme).toBe(0);
      expect(result.nonConforme).toBe(0);
      expect(result.nonApplicable).toBe(0);
      expect(result.notEvaluated).toBe(2);
      expect(result.total).toBe(2);
      expect(result.globalRate).toBeNull();
      expect(result.byTheme).toHaveLength(2);
    });
  });

  describe('All conformes', () => {
    it('should return 100 rate when all criteria are conforme', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'conforme' },
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.conforme).toBe(2);
      expect(result.nonConforme).toBe(0);
      expect(result.nonApplicable).toBe(0);
      expect(result.notEvaluated).toBe(0);
      expect(result.total).toBe(2);
      expect(result.globalRate).toBe(100);
    });
  });

  describe('Mixed statuses', () => {
    it('should calculate rate correctly with mixed statuses', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('1.3', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'non-conforme' },
        '1.3': { status: 'non-applicable' },
        // 2.1 not evaluated
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.conforme).toBe(1);
      expect(result.nonConforme).toBe(1);
      expect(result.nonApplicable).toBe(1);
      expect(result.notEvaluated).toBe(1);
      expect(result.total).toBe(4);
      // Rate = 1 / (1 + 1) * 100 = 50%
      expect(result.globalRate).toBe(50);
    });
  });

  describe('Non-applicable only', () => {
    it('should return null rate when C + NC = 0 (only NA)', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'non-applicable' },
        '1.2': { status: 'non-applicable' },
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.conforme).toBe(0);
      expect(result.nonConforme).toBe(0);
      expect(result.nonApplicable).toBe(2);
      expect(result.notEvaluated).toBe(0);
      expect(result.globalRate).toBeNull();
    });
  });

  describe('Per-theme breakdown', () => {
    it('should correctly group statistics by theme', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
        createMockCriteria('2.2', 'Cadres'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'non-conforme' },
        '2.1': { status: 'conforme' },
        '2.2': { status: 'conforme' },
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.byTheme).toHaveLength(2);

      const imagesTheme = result.byTheme.find(t => t.theme === 'Images');
      expect(imagesTheme).toBeDefined();
      expect(imagesTheme!.conforme).toBe(1);
      expect(imagesTheme!.nonConforme).toBe(1);
      expect(imagesTheme!.nonApplicable).toBe(0);
      expect(imagesTheme!.total).toBe(2);
      expect(imagesTheme!.rate).toBe(50); // 1 / (1 + 1) * 100

      const cadresTheme = result.byTheme.find(t => t.theme === 'Cadres');
      expect(cadresTheme).toBeDefined();
      expect(cadresTheme!.conforme).toBe(2);
      expect(cadresTheme!.nonConforme).toBe(0);
      expect(cadresTheme!.nonApplicable).toBe(0);
      expect(cadresTheme!.total).toBe(2);
      expect(cadresTheme!.rate).toBe(100);
    });
  });

  describe('Per-theme rate null handling', () => {
    it('should return null rate for theme when C + NC = 0', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'non-applicable' },
        // 2.1 not evaluated
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      const imagesTheme = result.byTheme.find(t => t.theme === 'Images');
      expect(imagesTheme!.rate).toBeNull(); // 0 / 0

      const cadresTheme = result.byTheme.find(t => t.theme === 'Cadres');
      expect(cadresTheme!.rate).toBeNull(); // 0 / 0
    });
  });

  describe('Design-system mode', () => {
    it('should track default-compliant and project-implementation separately', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('1.3', 'Images'),
      ];
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
        '1.2': { status: 'project-implementation' },
        '1.3': { status: 'non-applicable' },
      };

      const result = calculateSummaryStats(criteria, progress, 'design-system');

      expect(result.defaultCompliant).toBe(1);
      expect(result.projectImplementation).toBe(1);
      expect(result.nonApplicable).toBe(1);
      expect(result.notEvaluated).toBe(0);
      // Rate = (1 + 1) / (3 - 0 - 1) = 2 / 2 = 100%
      expect(result.globalRate).toBe(100);
    });
  });

  describe('Design-system mode per-theme', () => {
    it('should correctly calculate per-theme stats in design-system mode', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
        '1.2': { status: 'project-implementation' },
        '2.1': { status: 'non-applicable' },
      };

      const result = calculateSummaryStats(criteria, progress, 'design-system');

      const imagesTheme = result.byTheme.find(t => t.theme === 'Images');
      expect(imagesTheme!.defaultCompliant).toBe(1);
      expect(imagesTheme!.projectImplementation).toBe(1);
      expect(imagesTheme!.rate).toBe(100);

      const cadresTheme = result.byTheme.find(t => t.theme === 'Cadres');
      expect(cadresTheme!.nonApplicable).toBe(1);
      expect(cadresTheme!.rate).toBeNull(); // 0 / 0
    });
  });

  describe('Large datasets', () => {
    it('should handle many criteria efficiently', () => {
      const criteria = Array.from({ length: 100 }, (_, i) =>
        createMockCriteria(`${i}`, `Theme${Math.floor(i / 10)}`)
      );
      const progress: Progress['classic'] = {};

      Array.from({ length: 50 }, (_, i) => {
        progress[`${i}`] = { status: 'conforme' };
      });
      Array.from({ length: 25 }, (_, i) => {
        progress[`${50 + i}`] = { status: 'non-conforme' };
      });
      Array.from({ length: 15 }, (_, i) => {
        progress[`${75 + i}`] = { status: 'non-applicable' };
      });

      const result = calculateSummaryStats(criteria, progress, 'classic');

      expect(result.conforme).toBe(50);
      expect(result.nonConforme).toBe(25);
      expect(result.nonApplicable).toBe(15);
      expect(result.notEvaluated).toBe(10);
      expect(result.total).toBe(100);
      expect(result.globalRate).toBeCloseTo(66.67, 1); // 50 / (50 + 25) * 100 = 66.67%
    });
  });

  describe('Theme ordering', () => {
    it('should maintain consistent theme ordering', () => {
      const criteria = [
        createMockCriteria('3.1', 'Zebra'),
        createMockCriteria('1.1', 'Alpha'),
        createMockCriteria('2.1', 'Beta'),
      ];
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '2.1': { status: 'conforme' },
        '3.1': { status: 'conforme' },
      };

      const result = calculateSummaryStats(criteria, progress, 'classic');

      // Themes should appear in order of first appearance in criteria list
      expect(result.byTheme[0].theme).toBe('Zebra');
      expect(result.byTheme[1].theme).toBe('Alpha');
      expect(result.byTheme[2].theme).toBe('Beta');
    });
  });
});
