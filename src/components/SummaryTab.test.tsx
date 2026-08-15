import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryTab from './SummaryTab';
import type { CriteriaRGAA, Progress } from '../types';

const createMockCriteria = (id: string, theme: string): CriteriaRGAA => ({
  id,
  title: `Test Criteria ${id}`,
  url: 'https://example.com',
  theme,
  level: 'A',
});

describe('SummaryTab', () => {
  describe('Rendu général', () => {
    it('devrait afficher sans crash', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '2.1': { status: 'non-conforme' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      expect(container).toBeTruthy();
    });

    it('devrait afficher le titre Synthèse', () => {
      const criteria = [createMockCriteria('1.1', 'Images')];
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      };

      render(<SummaryTab criteriaList={criteria} progress={progress} mode="classic" />);
      expect(screen.getByText('Synthèse')).toBeTruthy();
    });

    it('devrait afficher l\'anneau AuditRing avec aria-label', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-conforme' },
        },
        designSystem: {},
      };

      render(<SummaryTab criteriaList={criteria} progress={progress} mode="classic" />);

      // AuditRing a role="img" et aria-label énonçant la répartition
      const ring = screen.getByRole('img', { name: /^Répartition des/ });
      expect(ring).toBeTruthy();
      expect(ring.getAttribute('aria-label')).toContain('Répartition');
    });

    it('devrait afficher le tableau ThemeSummaryTable', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '2.1': { status: 'non-conforme' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();
    });
  });

  describe('Mode classique', () => {
    it('devrait fonctionner en mode classic', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-conforme' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      expect(container).toBeTruthy();
    });

    it('devrait afficher les libellés classic (Conforme, Non conforme)', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('1.3', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-conforme' },
          '1.3': { status: 'non-applicable' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('Conforme');
      expect(text).toContain('Non conforme');
      expect(text).toContain('Non applicable');
    });
  });

  describe('Mode design system', () => {
    it('devrait fonctionner en mode design-system', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {},
        designSystem: {
          '1.1': { status: 'default-compliant' },
          '1.2': { status: 'project-implementation' },
        },
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="design-system" />
      );

      expect(container).toBeTruthy();
    });

    it('devrait afficher les libellés design-system (Conforme par défaut, À mettre en place)', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {},
        designSystem: {
          '1.1': { status: 'default-compliant' },
          '1.2': { status: 'project-implementation' },
        },
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="design-system" />
      );

      const text = container.textContent;
      expect(text).toContain('Conforme par défaut');
      expect(text).toContain('À mettre en place');
    });
  });

  describe('Cohérence des dénominateurs', () => {
    it('devrait distinguer évalués (conformes + écarts + NA) et tranchés (conformes + écarts)', () => {
      // Quatre critères : 1 conforme, 1 écart, 1 NA, 1 à évaluer
      // Évalués = 3 (conforme + écart + NA)
      // Tranchés = 2 (conforme + écart)
      // Avancement affiche 3/4, taux affiche 50% (1/2)
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
        createMockCriteria('1.3', 'Images'),
        createMockCriteria('1.4', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-conforme' },
          '1.3': { status: 'non-applicable' },
          // 1.4 pas évalué
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const text = container.textContent;
      // Avancement : 3/4 évalués
      expect(text).toContain('3');
      expect(text).toContain('4');
      // Taux : 50 % (1 conforme sur 2 tranchés)
      expect(text).toContain('50 %');
    });

    it('devrait mentionner que NA est exclu du calcul de taux', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-applicable' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('non applicable');
      expect(text).toContain('exclu');
    });
  });

  describe('Affichage des actions optionnelles', () => {
    it('devrait accepter une prop actions optionnelle', () => {
      const criteria = [createMockCriteria('1.1', 'Images')];
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          actions={<button>Exporter</button>}
        />
      );

      expect(container).toBeTruthy();
      expect(screen.getByText('Exporter')).toBeTruthy();
    });

    it('devrait fonctionner sans actions', () => {
      const criteria = [createMockCriteria('1.1', 'Images')];
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer une liste de critères vide', () => {
      const progress: Progress = { classic: {}, designSystem: {} };

      const { container } = render(
        <SummaryTab criteriaList={[]} progress={progress} mode="classic" />
      );

      expect(container).toBeTruthy();
    });

    it('devrait gérer aucun critère évalué', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = { classic: {}, designSystem: {} };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('0');
      expect(text).toContain('2');
    });

    it('devrait afficher – quand aucun critère tranché', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('1.2', 'Images'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'non-applicable' },
          '1.2': { status: 'non-applicable' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab criteriaList={criteria} progress={progress} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('–');
    });
  });
});
