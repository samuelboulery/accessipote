import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeSelector from './ThemeSelector';

const availableThemes = ['Images', 'Cadres', 'Couleurs', 'Multimédia'];

const defaultProps = {
  availableThemes,
  selectedThemes: ['Images', 'Cadres'],
  onThemesChange: vi.fn(),
};

describe('ThemeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le compteur thèmes sélectionnés/total', () => {
    render(<ThemeSelector {...defaultProps} />);
    expect(screen.getByText('Thèmes (2/4)')).toBeInTheDocument();
  });

  it('devrait afficher tous les thèmes disponibles', () => {
    render(<ThemeSelector {...defaultProps} />);
    for (const theme of availableThemes) {
      expect(screen.getByText(theme)).toBeInTheDocument();
    }
  });

  it('devrait afficher le bouton "Tout sélectionner"', () => {
    render(<ThemeSelector {...defaultProps} />);
    expect(screen.getByText('Tout sélectionner')).toBeInTheDocument();
  });

  it('devrait afficher le bouton "Tout effacer" quand des thèmes sont sélectionnés', () => {
    render(<ThemeSelector {...defaultProps} />);
    expect(screen.getByText('Tout effacer')).toBeInTheDocument();
  });

  it('ne devrait pas afficher "Tout effacer" quand aucun thème n\'est sélectionné', () => {
    render(<ThemeSelector {...defaultProps} selectedThemes={[]} />);
    expect(screen.queryByText('Tout effacer')).toBeNull();
  });

  it('devrait appeler onThemesChange avec tous les thèmes lors du clic sur "Tout sélectionner"', () => {
    const onThemesChange = vi.fn();
    render(<ThemeSelector {...defaultProps} onThemesChange={onThemesChange} />);
    fireEvent.click(screen.getByText('Tout sélectionner'));
    expect(onThemesChange).toHaveBeenCalledWith(availableThemes);
  });

  it('devrait appeler onThemesChange avec un tableau vide lors du clic sur "Tout effacer"', () => {
    const onThemesChange = vi.fn();
    render(<ThemeSelector {...defaultProps} onThemesChange={onThemesChange} />);
    fireEvent.click(screen.getByText('Tout effacer'));
    expect(onThemesChange).toHaveBeenCalledWith([]);
  });

  it('devrait désélectionner un thème déjà sélectionné lors du clic', () => {
    const onThemesChange = vi.fn();
    render(<ThemeSelector {...defaultProps} onThemesChange={onThemesChange} />);
    fireEvent.click(screen.getByText('Images'));
    expect(onThemesChange).toHaveBeenCalledWith(['Cadres']);
  });

  it('devrait sélectionner un thème non sélectionné lors du clic', () => {
    const onThemesChange = vi.fn();
    render(<ThemeSelector {...defaultProps} onThemesChange={onThemesChange} />);
    fireEvent.click(screen.getByText('Couleurs'));
    expect(onThemesChange).toHaveBeenCalledWith(['Images', 'Cadres', 'Couleurs']);
  });

  it('devrait afficher le compteur correct quand aucun thème n\'est sélectionné', () => {
    render(<ThemeSelector {...defaultProps} selectedThemes={[]} />);
    expect(screen.getByText('Thèmes (0/4)')).toBeInTheDocument();
  });

  it('devrait afficher le compteur correct quand tous les thèmes sont sélectionnés', () => {
    render(<ThemeSelector {...defaultProps} selectedThemes={availableThemes} />);
    expect(screen.getByText('Thèmes (4/4)')).toBeInTheDocument();
  });
});
