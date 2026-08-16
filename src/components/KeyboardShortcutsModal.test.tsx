import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import type { KeyboardShortcut } from '../types';

const shortcuts: KeyboardShortcut[] = [
  { keys: ['Ctrl', 'F'], description: 'Aller au champ de recherche', category: 'navigation', action: 'focusSearch' },
  { keys: ['Ctrl', 'E'], description: 'Copier en Markdown', category: 'export', action: 'exportMarkdown' },
  { keys: ['?'], description: 'Afficher les raccourcis clavier', category: 'help', action: 'showHelp' },
];

describe('KeyboardShortcutsModal', () => {
  it('est invisible quand isOpen est false', () => {
    render(<KeyboardShortcutsModal isOpen={false} shortcuts={shortcuts} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('est visible quand isOpen est true', () => {
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('affiche le titre de la modale', () => {
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
    expect(screen.getByText('Raccourcis clavier')).toBeInTheDocument();
  });

  it('affiche les raccourcis passés en props', () => {
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
    expect(screen.getByText('Aller au champ de recherche')).toBeInTheDocument();
    expect(screen.getByText('Copier en Markdown')).toBeInTheDocument();
    expect(screen.getByText('Afficher les raccourcis clavier')).toBeInTheDocument();
  });

  it('le bouton Fermer appelle onClose', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('un clic sur le fond appelle onClose', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('possède les attributs ARIA accessibles', () => {
    render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  // Une modale dont le focus s'échappe renvoie l'utilisateur au clavier dans la
  // page derrière, sans moyen de revenir. Ces cas étaient les seuls du composant
  // à n'être couverts par aucun test.
  describe('piège de focus', () => {
    const focusables = () =>
      Array.from(
        screen.getByRole('dialog').querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

    it('donne le focus au premier élément à l\'ouverture', async () => {
      render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);

      // Le focus initial est posé dans un requestAnimationFrame.
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)));

      expect(document.activeElement).toBe(focusables()[0]);
    });

    it('renvoie du dernier élément au premier avec Tab', () => {
      render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
      const elements = focusables();
      const dernier = elements[elements.length - 1];
      dernier.focus();

      fireEvent.keyDown(document, { key: 'Tab' });

      expect(document.activeElement).toBe(elements[0]);
    });

    it('renvoie du premier élément au dernier avec Shift+Tab', () => {
      render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
      const elements = focusables();
      elements[0].focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(document.activeElement).toBe(elements[elements.length - 1]);
    });

    it('ignore les touches autres que Tab', () => {
      render(<KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />);
      const elements = focusables();
      const dernier = elements[elements.length - 1];
      dernier.focus();

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(document.activeElement).toBe(dernier);
    });

    it('restitue le focus à l\'élément d\'origine à la fermeture', () => {
      const declencheur = document.createElement('button');
      document.body.appendChild(declencheur);
      declencheur.focus();

      const { rerender } = render(
        <KeyboardShortcutsModal isOpen={true} shortcuts={shortcuts} onClose={vi.fn()} />,
      );
      rerender(<KeyboardShortcutsModal isOpen={false} shortcuts={shortcuts} onClose={vi.fn()} />);

      expect(document.activeElement).toBe(declencheur);
      declencheur.remove();
    });

    it('ne pose aucun écouteur tant que la modale est fermée', () => {
      const ajout = vi.spyOn(document, 'addEventListener');
      render(<KeyboardShortcutsModal isOpen={false} shortcuts={shortcuts} onClose={vi.fn()} />);

      expect(ajout).not.toHaveBeenCalledWith('keydown', expect.any(Function));
      ajout.mockRestore();
    });
  });
});
