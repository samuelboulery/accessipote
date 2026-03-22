import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchFilters from './SearchFilters';
import type { CriteriaFilters } from '../types';

const defaultFilters: CriteriaFilters = {
  search: '',
  themes: [],
  level: '',
  status: '',
};

const defaultProps = {
  filters: defaultFilters,
  onFiltersChange: vi.fn(),
  themes: ['Images', 'Couleurs', 'Tableaux'],
  mode: 'classic' as const,
};

describe('SearchFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le champ de recherche', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('ID, titre, description...')).toBeInTheDocument();
  });

  it('devrait afficher les boutons de statut en mode classic', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('Tous')).toBeInTheDocument();
    expect(screen.getByText('Conforme')).toBeInTheDocument();
    expect(screen.getByText('Non conf.')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('devrait afficher les boutons de statut en mode design-system', () => {
    render(<SearchFilters {...defaultProps} mode="design-system" />);
    expect(screen.getByText('Par défaut')).toBeInTheDocument();
    expect(screen.getByText('À impl.')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('devrait appeler onFiltersChange lors de la saisie dans la recherche', () => {
    const onFiltersChange = vi.fn();
    render(<SearchFilters {...defaultProps} onFiltersChange={onFiltersChange} />);
    const input = screen.getByPlaceholderText('ID, titre, description...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, search: 'test' });
  });

  it('devrait appeler onFiltersChange lors du clic sur un statut', () => {
    const onFiltersChange = vi.fn();
    render(<SearchFilters {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText('Conforme'));
    expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, status: 'conforme' });
  });

  it('devrait appeler onFiltersChange avec status vide lors du clic sur Tous', () => {
    const onFiltersChange = vi.fn();
    const filtersWithStatus = { ...defaultFilters, status: 'conforme' };
    render(<SearchFilters {...defaultProps} filters={filtersWithStatus} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText('Tous'));
    expect(onFiltersChange).toHaveBeenCalledWith({ ...filtersWithStatus, status: '' });
  });

  it('devrait afficher la valeur de recherche actuelle', () => {
    const filtersWithSearch = { ...defaultFilters, search: 'images' };
    render(<SearchFilters {...defaultProps} filters={filtersWithSearch} />);
    const input = screen.getByDisplayValue('images');
    expect(input).toBeInTheDocument();
  });

  it('devrait mettre en évidence le bouton de statut actif', () => {
    const filtersWithStatus = { ...defaultFilters, status: 'conforme' };
    render(<SearchFilters {...defaultProps} filters={filtersWithStatus} />);
    const conformeButton = screen.getByText('Conforme');
    expect(conformeButton.className).toContain('bg-black');
  });

  it('devrait avoir un groupe aria-label pour les boutons de statut', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByRole('group', { name: 'Filtrer par statut' })).toBeInTheDocument();
  });
});
