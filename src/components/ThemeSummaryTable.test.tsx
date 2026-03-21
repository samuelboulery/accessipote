import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ThemeSummaryTable from './ThemeSummaryTable';
import type { ThemeStats } from '../utils/calculateSummaryStats';

describe('ThemeSummaryTable', () => {
  describe('Rendering', () => {
    it('should render table with correct headers', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();

      const headers = container.querySelectorAll('th');
      expect(headers.length).toBeGreaterThanOrEqual(5);
    });

    it('should render all theme rows', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
        {
          theme: 'Cadres',
          conforme: 3,
          nonConforme: 1,
          nonApplicable: 0,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 4,
          rate: 75,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display correct data in cells', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('Images');
      expect(text).toContain('5');
      expect(text).toContain('2');
      expect(text).toContain('1');
    });
  });

  describe('Rate formatting', () => {
    it('should display percentage with % symbol', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 1,
          nonConforme: 1,
          nonApplicable: 0,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 2,
          rate: 50,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('50%');
    });

    it('should display – when rate is null', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 0,
          nonConforme: 0,
          nonApplicable: 5,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 5,
          rate: null,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('–');
    });

    it('should round percentage to one decimal', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 1,
          nonConforme: 2,
          nonApplicable: 0,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 3,
          rate: 33.333,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('33.3%');
    });
  });

  describe('Accessibility', () => {
    it('should have scope="col" on header cells', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const headers = container.querySelectorAll('th[scope="col"]');
      expect(headers.length).toBeGreaterThanOrEqual(5);
    });

    it('should have proper table structure', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const thead = container.querySelector('thead');
      const tbody = container.querySelector('tbody');
      expect(thead).toBeTruthy();
      expect(tbody).toBeTruthy();
    });
  });

  describe('Dark mode', () => {
    it('should have dark mode classes', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const table = container.querySelector('table');
      expect(table?.className).toContain('dark:');
    });
  });

  describe('Empty themes', () => {
    it('should render empty table when no themes', () => {
      const { container } = render(
        <ThemeSummaryTable themes={[]} mode="classic" />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();
    });
  });

  describe('Mode display', () => {
    it('should render classic column headers (Conformes, Non-conformes)', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 5,
          nonConforme: 2,
          nonApplicable: 1,
          defaultCompliant: 0,
          projectImplementation: 0,
          total: 8,
          rate: 71.43,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="classic" />
      );

      const text = container.textContent;
      expect(text).toContain('Conformes');
      expect(text).toContain('Non-conformes');
    });

    it('should render design-system column headers (Par défaut, Implémentation)', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 0,
          nonConforme: 0,
          nonApplicable: 1,
          defaultCompliant: 3,
          projectImplementation: 2,
          total: 6,
          rate: 100,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="design-system" />
      );

      const text = container.textContent;
      expect(text).toContain('Par défaut');
      expect(text).toContain('Implémentation');
    });

    it('should display DS stats in design-system mode', () => {
      const themes: ThemeStats[] = [
        {
          theme: 'Images',
          conforme: 0,
          nonConforme: 0,
          nonApplicable: 1,
          defaultCompliant: 3,
          projectImplementation: 2,
          total: 6,
          rate: 100,
        },
      ];

      const { container } = render(
        <ThemeSummaryTable themes={themes} mode="design-system" />
      );

      const text = container.textContent;
      expect(text).toContain('3');
      expect(text).toContain('2');
      expect(text).toContain('100%');
    });
  });
});
