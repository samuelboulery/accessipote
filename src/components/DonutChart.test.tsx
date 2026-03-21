import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DonutChart from './DonutChart';

describe('DonutChart', () => {
  describe('Rendering', () => {
    it('should render SVG element', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={50} nonConforme={25} nonApplicable={15} notEvaluated={10} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should display global rate percentage in center', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={50} nonConforme={25} nonApplicable={15} notEvaluated={10} />
      );
      // Rate = 50 / (50 + 25) * 100 = 66.67% → rounds to 67%
      const text = container.textContent;
      expect(text).toMatch(/67%/);
    });

    it('should display -- in center when rate is null (all NA)', () => {
      render(
        <DonutChart mode="classic" conforme={0} nonConforme={0} nonApplicable={15} notEvaluated={10} />
      );
      expect(screen.getByText('–')).toBeTruthy();
    });

    it('should handle custom size prop', () => {
      const { container } = render(
        <DonutChart
          mode="classic"
          conforme={50}
          nonConforme={25}
          nonApplicable={15}
          notEvaluated={10}
          size={200}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
    });

    it('should use default size of 160', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={50} nonConforme={25} nonApplicable={15} notEvaluated={10} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });
  });

  describe('Edge cases', () => {
    it('should render single gray circle when all values are zero', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={0} nonConforme={0} nonApplicable={0} notEvaluated={0} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(screen.getByText('–')).toBeTruthy();
    });

    it('should render with all conforme', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={100} nonConforme={0} nonApplicable={0} notEvaluated={0} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      const text = container.textContent;
      expect(text).toMatch(/100%/);
    });

    it('should render with all non-applicable', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={0} nonConforme={0} nonApplicable={100} notEvaluated={0} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      // Rate should be null
      expect(screen.getByText('–')).toBeTruthy();
    });

    it('should render with only not evaluated', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={0} nonConforme={0} nonApplicable={0} notEvaluated={100} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(screen.getByText('–')).toBeTruthy();
    });
  });

  describe('Colors and styling', () => {
    it('should have dark mode support classes', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={50} nonConforme={25} nonApplicable={15} notEvaluated={10} />
      );
      const wrapper = container.querySelector('.dark\\:bg-gray-800') as HTMLElement;
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Percentage calculation', () => {
    it('should calculate 0% rate with only non-conforme', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={0} nonConforme={100} nonApplicable={0} notEvaluated={0} />
      );
      const text = container.textContent;
      expect(text).toMatch(/0%/);
    });

    it('should calculate 50% rate correctly', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={50} nonConforme={50} nonApplicable={0} notEvaluated={0} />
      );
      const text = container.textContent;
      expect(text).toMatch(/50%/);
    });

    it('should round percentage to integer', () => {
      const { container } = render(
        <DonutChart mode="classic" conforme={1} nonConforme={2} nonApplicable={0} notEvaluated={0} />
      );
      // 1 / (1 + 2) * 100 = 33.333...
      const text = container.textContent;
      expect(text).toMatch(/33%/);
    });
  });

  describe('Design-system mode', () => {
    it('should render SVG in design-system mode', () => {
      const { container } = render(
        <DonutChart
          mode="design-system"
          defaultCompliant={3}
          projectImplementation={2}
          nonApplicable={1}
          notEvaluated={0}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should display 100% when all criteria are covered in DS mode', () => {
      const { container } = render(
        <DonutChart
          mode="design-system"
          defaultCompliant={3}
          projectImplementation={2}
          nonApplicable={0}
          notEvaluated={0}
        />
      );
      // Rate = (3 + 2) / (5 - 0 - 0) = 100%
      const text = container.textContent;
      expect(text).toMatch(/100%/);
    });

    it('should display – when rate is null in DS mode (all NA)', () => {
      render(
        <DonutChart
          mode="design-system"
          defaultCompliant={0}
          projectImplementation={0}
          nonApplicable={5}
          notEvaluated={0}
        />
      );
      expect(screen.getByText('–')).toBeTruthy();
    });
  });
});
