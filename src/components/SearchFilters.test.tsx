import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchFilters from './SearchFilters';
import type { CriteriaFilters } from '../types';

const defaultFilters: CriteriaFilters = {
  search: '',
  level: '',
  status: '',
};

const defaultProps = {
  filters: defaultFilters,
  onFiltersChange: vi.fn(),
  levels: ['A', 'AA', 'AAA'],
  mode: 'classic' as const,
};

describe('SearchFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le champ de recherche', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('Rechercher un critère')).toBeInTheDocument();
  });

  it('devrait afficher le badge ⌘K dans le champ de recherche', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('devrait afficher le bouton Filtrer', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
  });

  it('devrait ouvrir le popover au clic sur Filtrer', () => {
    render(<SearchFilters {...defaultProps} />);
    const button = screen.getByText('Filtrer');
    fireEvent.click(button);
    expect(screen.getByLabelText('Niveau')).toBeInTheDocument();
    expect(screen.getByLabelText('Statut')).toBeInTheDocument();
  });

  it('devrait fermer le popover au clic sur Échap', () => {
    render(<SearchFilters {...defaultProps} />);
    const button = screen.getByText('Filtrer');
    fireEvent.click(button);
    expect(screen.getByLabelText('Niveau')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Niveau')).not.toBeInTheDocument();
  });

  it('devrait fermer le popover au clic extérieur', () => {
    render(<SearchFilters {...defaultProps} />);
    const button = screen.getByText('Filtrer');
    fireEvent.click(button);
    expect(screen.getByLabelText('Niveau')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByLabelText('Niveau')).not.toBeInTheDocument();
  });

  it('devrait appeler onFiltersChange lors de la saisie', () => {
    const onFiltersChange = vi.fn();
    render(<SearchFilters {...defaultProps} onFiltersChange={onFiltersChange} />);
    const input = screen.getByPlaceholderText('Rechercher un critère');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, search: 'test' });
  });

  it('devrait afficher le select Niveau dans le popover', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Filtrer'));
    const levelSelect = screen.getByDisplayValue('Tous les niveaux');
    expect(levelSelect).toBeInTheDocument();
  });

  it('devrait afficher le select Statut dans le popover', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Filtrer'));
    const statusSelect = screen.getByDisplayValue('Tous les statuts');
    expect(statusSelect).toBeInTheDocument();
  });

  it('devrait appeler onFiltersChange au changement de niveau', () => {
    const onFiltersChange = vi.fn();
    render(<SearchFilters {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText('Filtrer'));
    const levelSelect = screen.getByDisplayValue('Tous les niveaux');
    fireEvent.change(levelSelect, { target: { value: 'A' } });
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, level: 'A' });
  });

  it('devrait appeler onFiltersChange au changement de statut', () => {
    const onFiltersChange = vi.fn();
    render(<SearchFilters {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText('Filtrer'));
    const statusSelect = screen.getByDisplayValue('Tous les statuts');
    fireEvent.change(statusSelect, { target: { value: 'conforme' } });
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, status: 'conforme' });
  });

  it('devrait afficher le compteur de filtres actifs', () => {
    const filtersWithLevel = { ...defaultFilters, level: 'A' };
    render(<SearchFilters {...defaultProps} filters={filtersWithLevel} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('devrait afficher le compteur quand 2 filtres actifs', () => {
    const filtersWithBoth = { ...defaultFilters, level: 'A', status: 'conforme' };
    render(<SearchFilters {...defaultProps} filters={filtersWithBoth} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('devrait afficher le bouton « Effacer les filtres » quand filtres actifs', () => {
    const filtersWithLevel = { ...defaultFilters, level: 'A' };
    render(<SearchFilters {...defaultProps} filters={filtersWithLevel} />);
    fireEvent.click(screen.getByText('Filtrer'));
    expect(screen.getByText('Effacer les filtres')).toBeInTheDocument();
  });

  it('devrait appeler onFiltersChange au clic sur « Effacer les filtres »', () => {
    const onFiltersChange = vi.fn();
    const filtersWithLevel = { ...defaultFilters, level: 'A' };
    render(<SearchFilters {...defaultProps} filters={filtersWithLevel} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText('Filtrer'));
    fireEvent.click(screen.getByText('Effacer les filtres'));
    expect(onFiltersChange).toHaveBeenCalledWith({ search: '', level: '', status: '' });
  });

  it('devrait afficher les libellés de statut du mode classic', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByText('Filtrer'));
    const statusSelect = screen.getByDisplayValue('Tous les statuts');
    expect(statusSelect).toHaveTextContent('Conforme');
    expect(statusSelect).toHaveTextContent('Non conforme');
  });

  it('devrait afficher les libellés de statut du mode design-system', () => {
    render(<SearchFilters {...defaultProps} mode="design-system" />);
    fireEvent.click(screen.getByText('Filtrer'));
    const statusSelect = screen.getByDisplayValue('Tous les statuts');
    expect(statusSelect).toHaveTextContent('Conforme par défaut');
    expect(statusSelect).toHaveTextContent('À mettre en place');
  });
});
