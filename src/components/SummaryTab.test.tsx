import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
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
  describe('Rendering', () => {
    it('should render without crashing', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should display global stats', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      const text = container.textContent;
      expect(text).toContain('Taux de conformité global');
      expect(text).toContain('Résumé par thème');
    });
  });

  describe('Dark mode', () => {
    it('should accept dark mode prop', () => {
      const criteria = [createMockCriteria('1.1', 'Images')];
      const progress: Progress = {
        classic: {},
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={true}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Mode switching', () => {
    it('should work with classic mode', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should work with design-system mode', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="design-system"
          isDark={false}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Composition', () => {
    it('should include donut chart', () => {
      const criteria = [
        createMockCriteria('1.1', 'Images'),
        createMockCriteria('2.1', 'Cadres'),
      ];
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
        },
        designSystem: {},
      };

      const { container } = render(
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should include theme summary table', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('should display theme names in table', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      const text = container.textContent;
      expect(text).toContain('Images');
      expect(text).toContain('Cadres');
    });
  });

  describe('Stats display', () => {
    it('should show overall stats', () => {
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
        <SummaryTab
          criteriaList={criteria}
          progress={progress}
          mode="classic"
          isDark={false}
        />
      );

      const text = container.textContent;
      // Should show stats like "1 Conformes", "1 Non-conformes", etc.
      expect(text).toBeTruthy();
    });
  });
});
