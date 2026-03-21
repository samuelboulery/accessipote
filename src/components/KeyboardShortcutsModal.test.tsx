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
});
