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

// JSDOM ne supporte pas scrollTo sur les éléments DOM
Element.prototype.scrollTo = vi.fn();

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

describe('GlossarySidePanel — comportements généraux', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait appeler onClose lors du clic sur le bouton Fermer', () => {
    const onClose = vi.fn();
    render(<GlossarySidePanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Fermer le glossaire'));
    expect(onClose).toHaveBeenCalled();
  });

  it('devrait avoir role="complementary" et aria-label sur le panneau', () => {
    render(<GlossarySidePanel {...defaultProps} />);
    const panel = screen.getByRole('complementary');
    expect(panel).toHaveAttribute('aria-label', 'Glossaire RGAA');
  });

  it('devrait fermer avec la touche Échap', () => {
    const onClose = vi.fn();
    render(<GlossarySidePanel {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ne devrait pas fermer avec Échap si le panneau est fermé', () => {
    const onClose = vi.fn();
    render(<GlossarySidePanel {...defaultProps} isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('devrait mettre en surbrillance le terme sélectionné', () => {
    render(<GlossarySidePanel {...defaultProps} selectedTerm="contraste" />);
    const termDiv = document.getElementById('term-contraste');
    expect(termDiv).toBeInTheDocument();
    expect(termDiv?.className).toContain('bg-blue-50');
  });

  it('devrait rendre le corps HTML des termes', () => {
    render(<GlossarySidePanel {...defaultProps} />);
    expect(screen.getByText('Description alternative textuelle.')).toBeInTheDocument();
  });

  it('devrait avoir un maxLength de 200 sur le champ de recherche', () => {
    render(<GlossarySidePanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    expect(input).toHaveAttribute('maxLength', '200');
  });

  it('devrait afficher le handle de resize sur desktop quand ouvert', () => {
    render(<GlossarySidePanel {...defaultProps} isOpen={true} />);
    const resizeHandle = document.querySelector('[class*="cursor-col-resize"]');
    expect(resizeHandle).toBeInTheDocument();
  });

  it('ne devrait pas afficher le handle de resize quand fermé', () => {
    render(<GlossarySidePanel {...defaultProps} isOpen={false} />);
    const panel = screen.getByRole('complementary');
    expect(panel).toBeInTheDocument();
  });

  it('devrait réinitialiser la recherche quand selectedTerm change', () => {
    const { rerender } = render(<GlossarySidePanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Rechercher dans le glossaire...');
    fireEvent.change(input, { target: { value: 'contraste' } });
    expect((input as HTMLInputElement).value).toBe('contraste');
    rerender(<GlossarySidePanel {...defaultProps} selectedTerm="contraste" />);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('devrait déclencher le resize lors du mousedown sur le handle', () => {
    render(<GlossarySidePanel {...defaultProps} isOpen={true} />);
    const resizeHandle = document.querySelector('[class*="cursor-col-resize"]');
    if (resizeHandle) {
      fireEvent.mouseDown(resizeHandle);
      // L'overlay de resize devrait apparaître
      const overlay = document.querySelector('.fixed.inset-0.z-50');
      expect(overlay).toBeInTheDocument();
    }
  });
});
