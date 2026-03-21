import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportClassicMarkdown, exportDesignSystemMarkdown } from './exportMarkdown';
import type { CriteriaRGAA, Progress } from '../types';

describe('exportMarkdown', () => {
  // Mock data
  const mockCriteria: CriteriaRGAA[] = [
    {
      id: '1.1',
      title: 'Critère 1.1',
      description: 'Description du critère 1.1',
      url: 'https://example.com/1.1',
      theme: 'Images',
      level: 'A',
    },
    {
      id: '1.2',
      title: 'Critère [lien](https://example.com) 1.2',
      description: 'Description du critère 1.2',
      url: 'https://example.com/1.2',
      theme: 'Images',
      level: 'A',
    },
    {
      id: '2.1',
      title: 'Critère 2.1',
      description: 'Description du critère 2.1',
      url: 'https://example.com/2.1',
      theme: 'Couleurs',
      level: 'AA',
    },
  ];

  describe('exportClassicMarkdown', () => {
    beforeEach(() => {
      // Mock the date to ensure consistent output
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-21'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return markdown with header containing date', () => {
      const progress: Progress['classic'] = {};
      const result = exportClassicMarkdown(progress, []);

      expect(result).toContain('# Rapport de Conformité RGAA - Accessipote');
      expect(result).toContain('Date :');
    });

    it('should group compliant criteria correctly', () => {
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('## Critères Conformes');
      expect(result).toContain('### 1.1 - Critère 1.1');
      expect(result).toContain('### 1.2 - Critère lien 1.2');
      expect(result).toContain('Description du critère 1.1');
      expect(result).toContain('Description du critère 1.2');
    });

    it('should group non-compliant criteria correctly', () => {
      const progress: Progress['classic'] = {
        '1.1': { status: 'non-conforme' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('## Critères Non Conformes');
      expect(result).toContain('### 1.1 - Critère 1.1');
      expect(result).toContain('Description du critère 1.1');
    });

    it('should group non-applicable criteria correctly', () => {
      const progress: Progress['classic'] = {
        '2.1': { status: 'non-applicable' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('## Critères Non Applicables');
      expect(result).toContain('### 2.1 - Critère 2.1');
      expect(result).toContain('Description du critère 2.1');
    });

    it('should handle empty progress object', () => {
      const progress: Progress['classic'] = {};

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('# Rapport de Conformité RGAA - Accessipote');
      // Should only have header and date, no sections
      expect(result).not.toContain('## Critères');
    });

    it('should handle empty criteria list', () => {
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, []);

      expect(result).toContain('# Rapport de Conformité RGAA - Accessipote');
      // Should not include sections since no criteria match the progress
      expect(result).not.toContain('## Critères Conformes');
    });

    it('should clean markdown from criteria titles', () => {
      const progress: Progress['classic'] = {
        '1.2': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      // Should strip markdown links from title
      expect(result).toContain('### 1.2 - Critère lien 1.2');
      expect(result).not.toContain('[lien](https://example.com)');
    });

    it('should handle multiple groups simultaneously', () => {
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'non-conforme' },
        '2.1': { status: 'non-applicable' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('## Critères Conformes');
      expect(result).toContain('## Critères Non Conformes');
      expect(result).toContain('## Critères Non Applicables');
    });

    it('should not include sections for empty groups', () => {
      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).toContain('## Critères Conformes');
      expect(result).not.toContain('## Critères Non Conformes');
      expect(result).not.toContain('## Critères Non Applicables');
    });

    it('should ignore progress entries without matching criteria', () => {
      const progress: Progress['classic'] = {
        '99.99': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, mockCriteria);

      expect(result).not.toContain('99.99');
      expect(result).not.toContain('## Critères Conformes');
    });

    it('should handle criteria without description', () => {
      const criteriaWithoutDesc: CriteriaRGAA[] = [
        {
          id: '1.1',
          title: 'Critère sans description',
          url: 'https://example.com/1.1',
          theme: 'Images',
          level: 'A',
          // description is optional
        },
      ];

      const progress: Progress['classic'] = {
        '1.1': { status: 'conforme' },
      };

      const result = exportClassicMarkdown(progress, criteriaWithoutDesc);

      expect(result).toContain('## Critères Conformes');
      expect(result).toContain('### 1.1 - Critère sans description');
    });
  });

  describe('exportDesignSystemMarkdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-21'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return markdown with design system header', () => {
      const progress: Progress['designSystem'] = {};

      const result = exportDesignSystemMarkdown(progress, []);

      expect(result).toContain('# Checklist Design System - Conformité RGAA - Accessipote');
      expect(result).toContain('Date :');
    });

    it('should create table for default-compliant criteria', () => {
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
        '1.2': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('## Conformes par défaut');
      expect(result).toContain('| Numéro | Titre |');
      expect(result).toContain('|--------|-------|');
      expect(result).toContain('| 1.1 | Critère 1.1 |');
      expect(result).toContain('| 1.2 | Critère lien 1.2 |');
    });

    it('should create table for project-implementation criteria', () => {
      const progress: Progress['designSystem'] = {
        '2.1': { status: 'project-implementation' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('## À mettre en place côté projet');
      expect(result).toContain('| 2.1 | Critère 2.1 |');
    });

    it('should clean markdown from titles in tables', () => {
      const progress: Progress['designSystem'] = {
        '1.2': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('| 1.2 | Critère lien 1.2 |');
      expect(result).not.toContain('[lien](https://example.com)');
    });

    it('should handle empty progress object', () => {
      const progress: Progress['designSystem'] = {};

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('# Checklist Design System - Conformité RGAA - Accessipote');
      expect(result).not.toContain('| Numéro | Titre |');
    });

    it('should handle empty criteria list', () => {
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, []);

      expect(result).toContain('# Checklist Design System - Conformité RGAA - Accessipote');
      expect(result).not.toContain('| Numéro | Titre |');
    });

    it('should not include sections for empty groups', () => {
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('## Conformes par défaut');
      expect(result).not.toContain('## À mettre en place côté projet');
    });

    it('should handle both groups simultaneously', () => {
      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
        '2.1': { status: 'project-implementation' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).toContain('## Conformes par défaut');
      expect(result).toContain('## À mettre en place côté projet');
      expect(result).toContain('| 1.1 | Critère 1.1 |');
      expect(result).toContain('| 2.1 | Critère 2.1 |');
    });

    it('should ignore progress entries without matching criteria', () => {
      const progress: Progress['designSystem'] = {
        '99.99': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, mockCriteria);

      expect(result).not.toContain('99.99');
    });

    it('should handle criteria without description', () => {
      const criteriaWithoutDesc: CriteriaRGAA[] = [
        {
          id: '1.1',
          title: 'Critère sans description',
          url: 'https://example.com/1.1',
          theme: 'Images',
          level: 'A',
        },
      ];

      const progress: Progress['designSystem'] = {
        '1.1': { status: 'default-compliant' },
      };

      const result = exportDesignSystemMarkdown(progress, criteriaWithoutDesc);

      expect(result).toContain('## Conformes par défaut');
      expect(result).toContain('| 1.1 | Critère sans description |');
    });
  });
});
