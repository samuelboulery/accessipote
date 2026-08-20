import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ExportSettingsModal from './ExportSettingsModal';
import type { Audit, CriteriaRGAA } from '../types';
import { DEFAULT_TEMPLATES } from '../utils/markdownTemplate';
import { EXPORT_TEMPLATES_STORAGE_KEY } from '../constants';

const criteria: CriteriaRGAA[] = [
  { id: '1.1', title: 'Image porteuse d’information', url: 'u', theme: 'Images', level: 'A' },
];

const audit: Audit = {
  id: 'audit-1',
  name: 'Site vitrine',
  mode: 'classic',
  themes: [],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
  progress: { '1.1': { status: 'conforme' } },
  notes: {},
  pages: {},
  checkedTests: {},
};

const defaultProps = {
  isOpen: true,
  mode: 'classic' as const,
  previewData: { audit, criteria },
  onClose: vi.fn(),
};

function editor(): HTMLTextAreaElement {
  return screen.getByLabelText(/gabarit/i) as HTMLTextAreaElement;
}

describe('ExportSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('ne rend rien quand elle est fermée', () => {
    const { container } = render(<ExportSettingsModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('est un dialogue modal nommé', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/markdown/i);
  });

  it('ouvre sur le gabarit du mode', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    expect(editor()).toHaveValue(DEFAULT_TEMPLATES.classic);
  });

  it('ouvre sur le gabarit du mode design system', () => {
    render(<ExportSettingsModal {...defaultProps} mode="design-system" />);
    expect(editor()).toHaveValue(DEFAULT_TEMPLATES['design-system']);
  });

  it('énumère les jetons disponibles plutôt que de les laisser deviner', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    expect(screen.getByText('{{nomAudit}}')).toBeInTheDocument();
    expect(screen.getByText('{{#critères:ok}}…{{/critères}}')).toBeInTheDocument();
  });

  it('enregistre la frappe et met à jour la prévisualisation', async () => {
    render(<ExportSettingsModal {...defaultProps} />);
    fireEvent.change(editor(), { target: { value: 'Rapport {{nomAudit}}' } });

    await waitFor(() => {
      expect(screen.getByTestId('template-preview')).toHaveTextContent('Rapport Site vitrine');
    });
    expect(window.localStorage.getItem(EXPORT_TEMPLATES_STORAGE_KEY)).toContain('Rapport {{nomAudit}}');
  });

  it('annonce poliment la prévisualisation', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    expect(screen.getByTestId('template-preview')).toHaveAttribute('aria-live', 'polite');
  });

  it('signale un gabarit invalide sans planter', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    fireEvent.change(editor(), { target: { value: '{{#critères}}jamais fermé' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/bloc/i);
    // Une saisie invalide ne s'écrit pas : l'export doit rester utilisable.
    expect(window.localStorage.getItem(EXPORT_TEMPLATES_STORAGE_KEY) ?? '').not.toContain('jamais fermé');
  });

  it('explique ce qu’il manque quand aucun audit n’est ouvert', () => {
    render(<ExportSettingsModal {...defaultProps} previewData={null} />);
    expect(screen.getByTestId('template-preview')).toHaveTextContent(/aucun audit/i);
  });

  it('réinitialise au gabarit par défaut', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    fireEvent.change(editor(), { target: { value: '# perso' } });
    expect(editor()).toHaveValue('# perso');

    fireEvent.click(screen.getByRole('button', { name: /réinitialiser/i }));
    expect(editor()).toHaveValue(DEFAULT_TEMPLATES.classic);
  });

  it('se ferme par le bouton, par le fond et par Échap', () => {
    const onClose = vi.fn();
    render(<ExportSettingsModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('ne se ferme pas sur un clic dans le panneau', () => {
    const onClose = vi.fn();
    render(<ExportSettingsModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('retient le focus dans le dialogue', () => {
    render(<ExportSettingsModal {...defaultProps} />);
    const focusable = screen.getByRole('dialog').querySelectorAll<HTMLElement>('button, textarea');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
