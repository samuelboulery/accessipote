import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkActions from './BulkActions';

const defaultProps = {
  mode: 'classic' as const,
  displayedCriteriaCount: 5,
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
};

describe('BulkActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le nombre de critères affiches', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByText(/5 critères/)).toBeInTheDocument();
  });

  it('devrait afficher les options de statut en mode classic', () => {
    render(<BulkActions {...defaultProps} />);
    expect(screen.getByLabelText('Conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait afficher les options de statut en mode design-system', () => {
    render(<BulkActions {...defaultProps} mode="design-system" />);
    expect(screen.getByLabelText('Conforme par défaut')).toBeInTheDocument();
    expect(screen.getByLabelText('À mettre en place')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait sélectionner "conforme" par défaut en mode classic', () => {
    render(<BulkActions {...defaultProps} />);
    const radio = screen.getByLabelText('Conforme') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('devrait sélectionner "default-compliant" par défaut en mode design-system', () => {
    render(<BulkActions {...defaultProps} mode="design-system" />);
    const radio = screen.getByLabelText('Conforme par défaut') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('devrait mettre à jour le statut sélectionné lors d\'un changement de radio', () => {
    render(<BulkActions {...defaultProps} />);
    const radio = screen.getByLabelText('Non conforme') as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
  });

  it('devrait appeler onSelectAll avec le statut sélectionné lors du clic sur "Appliquer à tous"', () => {
    const onSelectAll = vi.fn();
    render(<BulkActions {...defaultProps} onSelectAll={onSelectAll} />);
    fireEvent.click(screen.getByText('Appliquer à tous'));
    expect(onSelectAll).toHaveBeenCalledWith('conforme');
  });

  it('devrait appeler onSelectAll avec un statut modifié', () => {
    const onSelectAll = vi.fn();
    render(<BulkActions {...defaultProps} onSelectAll={onSelectAll} />);
    fireEvent.click(screen.getByLabelText('Non applicable'));
    fireEvent.click(screen.getByText('Appliquer à tous'));
    expect(onSelectAll).toHaveBeenCalledWith('non-applicable');
  });

  it('devrait appeler onDeselectAll lors du clic sur "Tout effacer"', () => {
    const onDeselectAll = vi.fn();
    render(<BulkActions {...defaultProps} onDeselectAll={onDeselectAll} />);
    fireEvent.click(screen.getByText('Tout effacer'));
    expect(onDeselectAll).toHaveBeenCalled();
  });

  it('devrait avoir une légende accessible pour le groupe radio', () => {
    render(<BulkActions {...defaultProps} />);
    // La légende est sr-only mais présente dans le DOM
    expect(screen.getByText('Choisir un statut')).toBeInTheDocument();
  });
});
