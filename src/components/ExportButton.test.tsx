import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExportButton from './ExportButton';
import type { Audit, AuditProgress, CriteriaRGAA } from '../types';
import { DEFAULT_TEMPLATES } from '../utils/markdownTemplate';
import { EXPORT_TEMPLATES_STORAGE_KEY } from '../constants';

// La génération du document est testée dans utils/pdf/exportPdf.test.ts ; ici
// on vérifie seulement que le bouton la déclenche et sait échouer.
const mockExportAuditPdf = vi.fn().mockResolvedValue(undefined);
vi.mock('../utils/pdf/exportPdf', () => ({
  exportAuditPdf: (...args: unknown[]) => mockExportAuditPdf(...args),
}));

const mockCriteria: CriteriaRGAA[] = [
  { id: '1.1', title: 'Critère 1.1', url: 'http://example.com', theme: 'Images', level: 'A' },
  { id: '1.2', title: 'Critère 1.2', url: 'http://example.com', theme: 'Images', level: 'AA' },
];

const mockProgress: AuditProgress = {
  '1.1': { status: 'conforme' },
  '1.2': { status: 'non-conforme' },
};

// Un audit porte un mode figé : sa progression ne contient que les statuts de ce
// mode. Basculer `mode` sans changer `progress` décrirait un audit impossible.
const mockProgressDesignSystem: AuditProgress = {
  '1.1': { status: 'default-compliant' },
};

function makeAudit(overrides: Partial<Audit> = {}): Audit {
  return {
    id: 'audit-1',
    name: 'Audit de test',
    mode: 'classic',
    themes: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    progress: mockProgress,
    notes: {},
    pages: {},
    checkedTests: {},
    ...overrides,
  };
}

const designSystemAudit = makeAudit({
  mode: 'design-system',
  progress: mockProgressDesignSystem,
});

const defaultProps = {
  audit: makeAudit(),
  criteriaList: mockCriteria,
  onShowToast: vi.fn(),
};

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true });
}

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportAuditPdf.mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('nomme le format sur le bouton de copie', () => {
    render(<ExportButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Copier en Markdown' })).toBeInTheDocument();
  });

  it('affiche le bouton PDF en mode classic', () => {
    render(<ExportButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
  });

  it('affiche aussi le bouton PDF en mode design-system', () => {
    render(<ExportButton {...defaultProps} audit={designSystemAudit} />);
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
  });

  it('copie le markdown dans le presse-papiers en mode classic', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const onShowToast = vi.fn();
    render(<ExportButton {...defaultProps} onShowToast={onShowToast} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier en Markdown' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('# Rapport de Conformité RGAA'));
      expect(onShowToast).toHaveBeenCalledWith('Contenu copié dans le presse-papiers !', 'success');
    });
  });

  it('copie le markdown du mode design-system', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ExportButton {...defaultProps} audit={designSystemAudit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier en Markdown' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('# Checklist Design System'));
    });
  });

  it('emploie le gabarit personnalisé de l’utilisateur', async () => {
    window.localStorage.setItem(
      EXPORT_TEMPLATES_STORAGE_KEY,
      JSON.stringify({ classic: 'MON RAPPORT {{nomAudit}}' }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ExportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier en Markdown' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('MON RAPPORT Audit de test');
    });
  });

  it('retombe sur le gabarit par défaut si celui qui est stocké est invalide', async () => {
    window.localStorage.setItem(
      EXPORT_TEMPLATES_STORAGE_KEY,
      JSON.stringify({ classic: '{{#critères}}jamais fermé' }),
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ExportButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier en Markdown' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('# Rapport de Conformité RGAA'));
      expect(DEFAULT_TEMPLATES.classic).toContain('# Rapport de Conformité RGAA');
    });
  });

  it('télécharge le fichier si la copie dans le presse-papiers échoue', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('Clipboard error')));
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:url'), writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });

    render(<ExportButton {...defaultProps} />);

    // Les espions se posent après le rendu : Testing Library monte son conteneur
    // avec appendChild, et le remplacer trop tôt vide l'écran.
    const clickMock = vi.fn();
    let downloaded = '';
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLAnchorElement) {
        downloaded = node.download;
        node.click = clickMock;
      }
      return node;
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(node => node);

    fireEvent.click(screen.getByRole('button', { name: 'Copier en Markdown' }));

    await waitFor(() => {
      expect(clickMock).toHaveBeenCalled();
      expect(downloaded).toBe('rapport-rgaa.md');
    });

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('exporte le PDF avec l’audit entier', async () => {
    render(<ExportButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    await waitFor(() => {
      expect(mockExportAuditPdf).toHaveBeenCalledWith(defaultProps.audit, mockCriteria);
    });
  });

  it('exporte le PDF depuis un audit design-system', async () => {
    render(<ExportButton {...defaultProps} audit={designSystemAudit} />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    await waitFor(() => {
      expect(mockExportAuditPdf).toHaveBeenCalledWith(designSystemAudit, mockCriteria);
    });
  });

  it('signale l’export PDF en cours et rend la main ensuite', async () => {
    let release!: () => void;
    mockExportAuditPdf.mockReturnValue(new Promise<void>(resolve => { release = resolve; }));

    render(<ExportButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    const button = await screen.findByRole('button', { name: /Export…/ });
    expect(button).toBeDisabled();

    release();
    await waitFor(() => expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled());
  });

  it('affiche un toast d’erreur si l’export PDF échoue', async () => {
    mockExportAuditPdf.mockRejectedValue(new Error('PDF error'));
    const onShowToast = vi.fn();

    render(<ExportButton {...defaultProps} onShowToast={onShowToast} />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    await waitFor(() => {
      expect(onShowToast).toHaveBeenCalledWith(expect.stringContaining('Erreur'), 'error');
    });
  });
});
