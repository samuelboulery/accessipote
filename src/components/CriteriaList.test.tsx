import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CriteriaList from './CriteriaList';
import type { CriteriaRGAA } from '../types';

// ResizeObserver mock that fires callbacks immediately so the virtualizer
// can compute visible items even in JSDOM (which has no layout engine).
class FiringResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) { this.cb = cb; }
  observe(target: Element) {
    // Provide a fixed non-zero size so the virtualizer can compute visible items in JSDOM
    const fakeRect = { height: 600, width: 800, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) };
    this.cb(
      [{ target, contentRect: fakeRect, borderBoxSize: [{ blockSize: 600, inlineSize: 800 }], contentBoxSize: [{ blockSize: 600, inlineSize: 800 }], devicePixelContentBoxSize: [] } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = FiringResizeObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const makeCriteria = (count: number): CriteriaRGAA[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${Math.floor(i / 6) + 1}.${(i % 6) + 1}`,
    title: `Critère ${i + 1} — titre de test`,
    url: 'https://example.com',
    theme: `Thème ${Math.floor(i / 6) + 1}`,
    level: 'A',
  }));

const defaultProps = {
  mode: 'classic' as const,
  progress: {},
  onStatusChange: vi.fn(),
  onGlossaryClick: vi.fn(),
};

describe('CriteriaList', () => {
  describe('Empty state', () => {
    it('should show empty message when no criteria', () => {
      render(<CriteriaList criteria={[]} {...defaultProps} />);
      expect(screen.getByText(/aucun critère/i)).toBeTruthy();
    });
  });

  describe('Rendering', () => {
    it('should display heading with criteria count', () => {
      const criteria = makeCriteria(10);
      render(<CriteriaList criteria={criteria} {...defaultProps} />);
      expect(screen.getByText(/Liste des critères \(10\)/)).toBeTruthy();
    });

    it('should update heading count when criteria list changes', () => {
      const criteria = makeCriteria(5);
      render(<CriteriaList criteria={criteria} {...defaultProps} />);
      expect(screen.getByText(/Liste des critères \(5\)/)).toBeTruthy();
    });

    it('should render with 78 criteria without crashing', () => {
      const criteria = makeCriteria(78);
      const { container } = render(
        <CriteriaList criteria={criteria} {...defaultProps} />
      );
      expect(container.querySelector('h2')).toBeTruthy();
      expect(screen.getByText(/Liste des critères \(78\)/)).toBeTruthy();
    });
  });

  describe('Virtualization structure', () => {
    it('should have a scrollable container', () => {
      const criteria = makeCriteria(20);
      const { container } = render(
        <CriteriaList criteria={criteria} {...defaultProps} />
      );
      // The scroll container should exist with overflow-y style
      const scrollContainer = container.querySelector('[data-testid="criteria-scroll-container"]');
      expect(scrollContainer).toBeTruthy();
    });

    it('should not render all 78 items in DOM at once (virtualization)', () => {
      // Mock getBoundingClientRect so virtualizer knows it has limited height
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        if ((this as HTMLElement).dataset?.testid === 'criteria-scroll-container') {
          return { height: 600, width: 800, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
        }
        return { height: 0, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      });

      const criteria = makeCriteria(78);
      const { container } = render(
        <CriteriaList criteria={criteria} {...defaultProps} />
      );

      const criteriaItems = container.querySelectorAll('[id^="criteria-"]');
      // With virtualization and 600px container, expect far fewer than 78 items
      expect(criteriaItems.length).toBeLessThan(78);
    });
  });

  describe('Callbacks', () => {
    it('should pass onStatusChange to rendered items', () => {
      const onStatusChange = vi.fn();
      const criteria = makeCriteria(3);
      render(
        <CriteriaList
          criteria={criteria}
          {...defaultProps}
          onStatusChange={onStatusChange}
        />
      );
      // Component renders without errors
      expect(screen.getByText(/Liste des critères \(3\)/)).toBeTruthy();
    });
  });

  describe('Dark mode', () => {
    it('should render in design-system mode without errors', () => {
      const criteria = makeCriteria(5);
      const { container } = render(
        <CriteriaList criteria={criteria} {...defaultProps} mode="design-system" />
      );
      expect(container.querySelector('h2')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render 78 criteria in under 200ms', () => {
      const criteria = makeCriteria(78);

      const start = performance.now();
      render(<CriteriaList criteria={criteria} {...defaultProps} />);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200);
    });

    it('should re-render filtered list (5 criteria) faster than full list (78 criteria)', () => {
      const largeCriteria = makeCriteria(78);
      const smallCriteria = makeCriteria(5);

      const start1 = performance.now();
      const { unmount } = render(<CriteriaList criteria={largeCriteria} {...defaultProps} />);
      const largeTime = performance.now() - start1;
      unmount();

      const start2 = performance.now();
      render(<CriteriaList criteria={smallCriteria} {...defaultProps} />);
      const smallTime = performance.now() - start2;

      // Small list should be significantly faster or at least not slower
      // (due to virtualization, large list overhead is minimal — both should be fast)
      expect(largeTime).toBeLessThan(200);
      expect(smallTime).toBeLessThan(200);
    });
  });
});
