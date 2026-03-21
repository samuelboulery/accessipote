import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GlossarySidePanel from './GlossarySidePanel';
import type { GlossaryTerm } from '../types';

const glossary: GlossaryTerm[] = [
  { title: 'Alternative textuelle', body: '<p>Description alternative textuelle.</p>' },
  { title: 'Contraste', body: '<p>Rapport de contraste entre couleurs.</p>' },
  { title: 'Intitulé de lien', body: '<p>Texte du lien accessible.</p>' },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  glossary,
  width: 400,
  onWidthChange: vi.fn(),
};

describe('GlossarySidePanel — recherche debouncée', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche tous les termes à l\'ouverture', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    expect(screen.getByText('Alternative textuelle')).toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.getByText('Intitulé de lien')).toBeInTheDocument();
  });

  it('ne filtre pas immédiatement après la saisie', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    fireEvent.change(input, { target: { value: 'Contraste' } });

    // Avant le délai de debounce, tous les termes sont encore visibles
    expect(screen.getByText('Alternative textuelle')).toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.getByText('Intitulé de lien')).toBeInTheDocument();
  });

  it('filtre les termes après le délai de debounce (200ms)', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    fireEvent.change(input, { target: { value: 'Contraste' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Alternative textuelle')).not.toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.queryByText('Intitulé de lien')).not.toBeInTheDocument();
  });

  it('annule le filtre précédent si la saisie change avant 200ms', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');

    fireEvent.change(input, { target: { value: 'Alt' } });
    act(() => { vi.advanceTimersByTime(100); }); // pas encore 200ms

    // Change la saisie avant que le debounce se déclenche
    fireEvent.change(input, { target: { value: 'Contraste' } });
    act(() => { vi.advanceTimersByTime(200); }); // déclenche le debounce sur 'Contraste'

    expect(screen.queryByText('Alternative textuelle')).not.toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
  });

  it('affiche le message "Aucun terme trouvé" après 200ms si aucun résultat', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    fireEvent.change(input, { target: { value: 'zzz' } });

    // Avant le debounce : les termes sont encore là
    expect(screen.getByText('Alternative textuelle')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(200); });

    expect(screen.getByText(/Aucun terme trouvé/)).toBeInTheDocument();
  });

  it('réaffiche tous les termes quand le champ est vidé après 200ms', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');

    fireEvent.change(input, { target: { value: 'Contraste' } });
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByText('Alternative textuelle')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    act(() => { vi.advanceTimersByTime(200); });

    expect(screen.getByText('Alternative textuelle')).toBeInTheDocument();
    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.getByText('Intitulé de lien')).toBeInTheDocument();
  });

  it('la recherche est insensible à la casse', () => {
    render(<GlossarySidePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    fireEvent.change(input, { target: { value: 'contraste' } });
    act(() => { vi.advanceTimersByTime(200); });

    expect(screen.getByText('Contraste')).toBeInTheDocument();
    expect(screen.queryByText('Alternative textuelle')).not.toBeInTheDocument();
  });
});
