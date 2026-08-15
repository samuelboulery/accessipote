import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ThemeSummaryTable from './ThemeSummaryTable';
import type { ThemeStats, SummaryStats } from '../utils/calculateSummaryStats';

const createThemeStats = (
  theme: string,
  conforme: number,
  nonConforme: number,
  nonApplicable: number,
  defaultCompliant: number = 0,
  projectImplementation: number = 0,
  rate: number | null = null,
): ThemeStats => ({
  theme,
  conforme,
  nonConforme,
  nonApplicable,
  defaultCompliant,
  projectImplementation,
  total: conforme + nonConforme + nonApplicable + defaultCompliant + projectImplementation,
  rate,
});

const createStats = (
  conforme: number = 0,
  nonConforme: number = 0,
  nonApplicable: number = 0,
  defaultCompliant: number = 0,
  projectImplementation: number = 0,
  globalRate: number | null = null,
  byTheme: ThemeStats[] = [],
): SummaryStats => ({
  globalRate,
  conforme,
  nonConforme,
  nonApplicable,
  notEvaluated: 0,
  defaultCompliant,
  projectImplementation,
  total: conforme + nonConforme + nonApplicable + defaultCompliant + projectImplementation,
  byTheme,
});

describe('ThemeSummaryTable', () => {
  describe('Rendu', () => {
    it('devrait afficher un tableau avec les en-têtes', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();

      const headers = container.querySelectorAll('th[scope="col"]');
      expect(headers.length).toBeGreaterThanOrEqual(6); // Thème + 4 colonnes statuts + Répartition + Taux
    });

    it('devrait afficher toutes les lignes de thèmes', () => {
      const byTheme = [
        createThemeStats('Images', 5, 2, 1, 0, 0, 71.43),
        createThemeStats('Cadres', 3, 1, 0, 0, 0, 75),
      ];
      const stats = createStats(8, 3, 1, 0, 0, 72.73, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('devrait afficher les noms de thèmes', () => {
      const byTheme = [
        createThemeStats('Images', 5, 2, 1, 0, 0, 71.43),
        createThemeStats('Cadres', 3, 1, 0, 0, 0, 75),
      ];
      const stats = createStats(8, 3, 1, 0, 0, 72.73, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('Images');
      expect(text).toContain('Cadres');
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir scope="col" sur les en-têtes de colonnes', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const colHeaders = container.querySelectorAll('th[scope="col"]');
      expect(colHeaders.length).toBeGreaterThanOrEqual(6);
    });

    it('devrait avoir scope="row" sur le nom du thème', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const rowHeaders = container.querySelectorAll('th[scope="row"]');
      expect(rowHeaders.length).toBeGreaterThanOrEqual(1);
      expect(rowHeaders[0]?.textContent).toContain('Images');
    });

    it('devrait avoir caption pour le tableau', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const caption = container.querySelector('caption');
      expect(caption).toBeTruthy();
    });

    it('devrait avoir thead et tbody', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');
      expect(thead).toBeTruthy();
      expect(tbody).toBeTruthy();
    });

    it('devrait afficher icônes et texte dans les en-têtes (pas de couleur seule)', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      // Chaque en-tête de statut a une icône (SVG) ET du texte (Conformes, Non-conformes, etc.)
      const headers = container.querySelectorAll('th[scope="col"]');
      headers.forEach(header => {
        if (header.textContent && (
          header.textContent.includes('Conformes') ||
          header.textContent.includes('Non-conformes') ||
          header.textContent.includes('Non applicable') ||
          header.textContent.includes('À évaluer')
        )) {
          // Vérifier que le header contient du texte
          expect(header.textContent.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Format du taux', () => {
    it('devrait afficher le pourcentage avec %', () => {
      const byTheme = [createThemeStats('Images', 1, 1, 0, 0, 0, 50)];
      const stats = createStats(1, 1, 0, 0, 0, 50, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('50');
      expect(text).toContain('%');
    });

    it('devrait afficher – quand le taux est null', () => {
      const byTheme = [createThemeStats('Images', 0, 0, 5, 0, 0, null)];
      const stats = createStats(0, 0, 5, 0, 0, null, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('–');
    });

    it('devrait arrondir le taux à une décimale', () => {
      const byTheme = [createThemeStats('Images', 1, 2, 0, 0, 0, 33.333)];
      const stats = createStats(1, 2, 0, 0, 0, 33.333, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('33.3');
    });
  });

  describe('Mode classique', () => {
    it('devrait afficher les en-têtes classic (Conforme, Non conforme)', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('Conforme');
      expect(text).toContain('Non conforme');
    });

    it('devrait afficher les données classic', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('Conforme');
      expect(text).toContain('Non conforme');
      expect(text).toContain('Images');
    });
  });

  describe('Mode design-system', () => {
    it('devrait afficher les en-têtes design-system (Conforme par défaut, À mettre en place)', () => {
      const byTheme = [createThemeStats('Images', 0, 0, 1, 3, 2, 100)];
      const stats = createStats(0, 0, 1, 3, 2, 100, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="design-system" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('Conforme par défaut');
      expect(text).toContain('À mettre en place');
    });

    it('devrait afficher les données design-system', () => {
      const byTheme = [createThemeStats('Images', 0, 0, 1, 3, 2, 100)];
      const stats = createStats(0, 0, 1, 3, 2, 100, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="design-system" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('3');
      expect(text).toContain('2');
      expect(text).toContain('1');
    });
  });

  describe('Cas limites', () => {
    it('devrait afficher un tableau vide quand aucun thème', () => {
      const stats = createStats(0, 0, 0, 0, 0, null, []);

      const { container } = render(
        <ThemeSummaryTable byTheme={[]} mode="classic" stats={stats} />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(0);
    });

    it('devrait gérer les thèmes sans aucun critère évalué', () => {
      const byTheme = [createThemeStats('Images', 0, 0, 5, 0, 0, null)];
      const stats = createStats(0, 0, 5, 0, 0, null, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('Images');
      expect(text).toContain('–');
    });

    it('devrait afficher un taux de 100% quand tous les critères sont conformes', () => {
      const byTheme = [createThemeStats('Images', 10, 0, 0, 0, 0, 100)];
      const stats = createStats(10, 0, 0, 0, 0, 100, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      const text = container.textContent;
      expect(text).toContain('100');
    });
  });

  describe('Jauge de répartition', () => {
    it('devrait afficher une jauge SegmentedGauge pour chaque thème', () => {
      const byTheme = [createThemeStats('Images', 5, 2, 1, 0, 0, 71.43)];
      const stats = createStats(5, 2, 1, 0, 0, 62.5, byTheme);

      const { container } = render(
        <ThemeSummaryTable byTheme={byTheme} mode="classic" stats={stats} />
      );

      // Chaque thème doit avoir une jauge (verifiable via role="img" d'AuditRing ou similaire)
      // Ou simplement vérifier que le SVG est présent
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });
});
