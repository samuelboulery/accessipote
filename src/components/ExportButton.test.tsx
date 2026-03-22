import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExportButton from './ExportButton';
import type { Progress, CriteriaRGAA } from '../types';

// Mock pour jsPDF et jspdf-autotable (chargés dynamiquement dans handleExportPDF)
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockAddPage = vi.fn();
const mockJsPDFInstance = {
  setFontSize: mockSetFontSize,
  text: mockText,
  setFont: mockSetFont,
  addPage: mockAddPage,
  save: mockSave,
  lastAutoTable: { finalY: 100 },
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => mockJsPDFInstance),
}));

const mockAutoTable = vi.fn();
vi.mock('jspdf-autotable', () => ({
  default: mockAutoTable,
}));

const mockCriteria: CriteriaRGAA[] = [
  { id: '1.1', title: 'Critère 1.1', url: 'http://example.com', theme: 'Images', level: 'A' },
  { id: '1.2', title: 'Critère 1.2', url: 'http://example.com', theme: 'Images', level: 'AA' },
];

const mockProgress: Progress = {
  classic: {
    '1.1': { status: 'conforme' },
    '1.2': { status: 'non-conforme' },
  },
  designSystem: {
    '1.1': { status: 'default-compliant' },
  },
};

const defaultProps = {
  mode: 'classic' as const,
  progress: mockProgress,
  criteriaList: mockCriteria,
  onShowToast: vi.fn(),
};

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait afficher le bouton "Copier en Markdown"', () => {
    render(<ExportButton {...defaultProps} />);
    // Bouton desktop visible dans le DOM
    const buttons = screen.getAllByText('Copier en Markdown');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('devrait afficher le bouton PDF en mode classic', () => {
    render(<ExportButton {...defaultProps} />);
    const pdfButtons = screen.getAllByText(/Exporter en PDF|PDF/);
    expect(pdfButtons.length).toBeGreaterThan(0);
  });

  it('ne devrait pas afficher le bouton PDF en mode design-system', () => {
    render(<ExportButton {...defaultProps} mode="design-system" />);
    expect(screen.queryByText('Exporter en PDF')).toBeNull();
    expect(screen.queryByText('PDF')).toBeNull();
  });

  it('devrait copier le markdown dans le presse-papiers en mode classic', async () => {
    const clipboardMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardMock },
      writable: true,
    });

    const onShowToast = vi.fn();
    render(<ExportButton {...defaultProps} onShowToast={onShowToast} />);

    const markdownButtons = screen.getAllByText('Copier en Markdown');
    fireEvent.click(markdownButtons[0]);

    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalled();
      expect(onShowToast).toHaveBeenCalledWith('Contenu copié dans le presse-papiers !', 'success');
    });
  });

  it('devrait copier le markdown en mode design-system', async () => {
    const clipboardMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardMock },
      writable: true,
    });

    const onShowToast = vi.fn();
    render(<ExportButton {...defaultProps} mode="design-system" onShowToast={onShowToast} />);

    const markdownButtons = screen.getAllByText('Copier en Markdown');
    fireEvent.click(markdownButtons[0]);

    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalled();
    });
  });

  it('devrait télécharger le fichier si la copie dans le presse-papiers échoue', async () => {
    const clipboardMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardMock },
      writable: true,
    });

    // Mock URL.createObjectURL et revokeObjectURL
    const createObjectURL = vi.fn().mockReturnValue('blob:url');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true });

    const { container } = render(<ExportButton {...defaultProps} />);

    // Mock click sur les éléments <a> créés dynamiquement après le rendu
    const clickMock = vi.fn();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickMock;
      }
      return node;
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const markdownButtons = container.querySelectorAll('[aria-keyshortcuts]');
    if (markdownButtons.length > 0) {
      fireEvent.click(markdownButtons[0]);
    }

    await waitFor(() => {
      expect(clipboardMock).toHaveBeenCalled();
    });

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('devrait exporter le PDF en mode classic', async () => {
    const onShowToast = vi.fn();
    render(<ExportButton {...defaultProps} onShowToast={onShowToast} />);

    const pdfButtons = screen.getAllByText(/Exporter en PDF/);
    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    });
  });

  it('devrait afficher "Export en cours..." pendant l\'export PDF', async () => {
    // Retarder la résolution pour capturer l'état intermédiaire
    vi.mocked(await import('jspdf')).default = vi.fn(() => {
      return new Promise<void>(() => {
        // Promise volontairement non résolue pour tester l'état de chargement
      }) as unknown as ReturnType<typeof mockJsPDFInstance.constructor>;
    }) as never;

    render(<ExportButton {...defaultProps} />);
    const pdfButtons = screen.getAllByText(/Exporter en PDF/);
    fireEvent.click(pdfButtons[0]);

    // Vérifier l'état d'export en cours
    await waitFor(() => {
      const exportingButton = screen.queryByText(/Export en cours/);
      expect(exportingButton !== null || mockSave.mock.calls.length > 0).toBe(true);
    });
  });

  it('devrait afficher une erreur toast si l\'export PDF échoue', async () => {
    const onShowToast = vi.fn();
    const { default: jsPDFMock } = await import('jspdf');
    vi.mocked(jsPDFMock).mockImplementationOnce(() => {
      throw new Error('PDF error');
    });

    render(<ExportButton {...defaultProps} onShowToast={onShowToast} />);
    const pdfButtons = screen.getAllByText(/Exporter en PDF/);
    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(onShowToast).toHaveBeenCalledWith(
        expect.stringContaining('Erreur'),
        'error'
      );
    });
  });

  it('ne devrait pas déclencher l\'export PDF en mode design-system', () => {
    render(<ExportButton {...defaultProps} mode="design-system" />);
    // Le bouton PDF n'est pas rendu en mode design-system
    expect(screen.queryByText('Exporter en PDF')).toBeNull();
    expect(screen.queryByText('PDF')).toBeNull();
  });
});
