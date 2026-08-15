import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CriteriaList from './CriteriaList';
import type { CriteriaRGAA } from '../types';

const makeCriteria = (count: number): CriteriaRGAA[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${Math.floor(i / 6) + 1}.${(i % 6) + 1}`,
    title: `Critère ${i + 1}`,
    url: 'https://example.com',
    theme: `Thème ${Math.floor(i / 6) + 1}`,
    level: 'A',
  }));

const defaultProps = {
  mode: 'classic' as const,
  progress: {},
  onStatusChange: vi.fn(),
  onGlossaryClick: vi.fn(),
  onExpand: vi.fn(),
};

describe('CriteriaList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('État vide', () => {
    it('devrait afficher le composant vide quand aucun critère', () => {
      render(<CriteriaList criteria={[]} {...defaultProps} />);
      expect(screen.getByText(/Aucun critère ne correspond/)).toBeInTheDocument();
    });

    it('devrait afficher un emptyState personnalisé si fourni', () => {
      render(
        <CriteriaList
          criteria={[]}
          {...defaultProps}
          emptyState={<div>État personnalisé</div>}
        />
      );
      expect(screen.getByText('État personnalisé')).toBeInTheDocument();
    });
  });

  describe('Rendu', () => {
    it('devrait rendre une ul avec un li par critère', () => {
      const criteria = makeCriteria(3);
      const { container } = render(<CriteriaList criteria={criteria} {...defaultProps} />);
      const ul = container.querySelector('ul');
      expect(ul).toBeInTheDocument();
      const items = ul?.querySelectorAll('li');
      expect(items).toHaveLength(3);
    });

    it('devrait rendre TOUS les critères dans le DOM (pas de virtualiseur)', () => {
      const criteria = makeCriteria(14);
      const { container } = render(<CriteriaList criteria={criteria} {...defaultProps} />);
      const criteriaItems = container.querySelectorAll('[id^="criteria-"]');
      expect(criteriaItems).toHaveLength(14);
    });

    it('devrait rendre 78 critères en entier sans virtualiseur', () => {
      const criteria = makeCriteria(78);
      const { container } = render(<CriteriaList criteria={criteria} {...defaultProps} />);
      const criteriaItems = container.querySelectorAll('[id^="criteria-"]');
      expect(criteriaItems).toHaveLength(78);
    });

    it('devrait appeler onExpand au clic sur « Voir les tests »', () => {
      const onExpand = vi.fn();
      const criteria = makeCriteria(1);
      render(<CriteriaList criteria={criteria} {...defaultProps} onExpand={onExpand} />);
      const button = screen.getByText('Voir les tests');
      button.click();
      expect(onExpand).toHaveBeenCalledWith(criteria[0].id);
    });
  });

  describe('Mode design-system', () => {
    it('devrait rendre sans erreur en mode design-system', () => {
      const criteria = makeCriteria(5);
      render(<CriteriaList criteria={criteria} {...defaultProps} mode="design-system" />);
      expect(screen.getByText('Critère 1')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('devrait rendre 78 critères en moins de 2000ms', () => {
      const criteria = makeCriteria(78);
      const start = performance.now();
      render(<CriteriaList criteria={criteria} {...defaultProps} />);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  });
});
