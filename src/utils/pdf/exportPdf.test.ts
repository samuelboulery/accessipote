import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportAuditPdf } from './exportPdf';
import type { Audit, CriteriaRGAA } from '../../types';

const mockSave = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockSetPage = vi.fn();
const mockAddPage = vi.fn();
const mockSetProperties = vi.fn();
const mockSetLanguage = vi.fn();

const mockDoc = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  text: mockText,
  rect: mockRect,
  roundedRect: mockRoundedRect,
  addPage: mockAddPage,
  setPage: mockSetPage,
  getNumberOfPages: vi.fn(() => 3),
  splitTextToSize: vi.fn((value: string) => [value]),
  getTextWidth: vi.fn(() => 20),
  setLanguage: mockSetLanguage,
  setProperties: mockSetProperties,
  save: mockSave,
  lastAutoTable: { finalY: 120 },
};

// `new jsPDF()` : depuis Vitest 4, `vi.fn` n'enveloppe plus l'implémentation
// fournie, et une fonction fléchée ne peut pas être appelée avec `new`.
vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return mockDoc;
  }),
}));

const mockAutoTable = vi.fn();
vi.mock('jspdf-autotable', () => ({
  default: mockAutoTable,
}));

const criteria: CriteriaRGAA[] = [
  { id: '1.1', title: 'Image porteuse d’information', url: 'u', theme: 'Images', level: 'A' },
  { id: '1.2', title: 'Image [de décoration](https://ex.fr)', url: 'u', theme: 'Images', level: 'A' },
  { id: '3.1', title: 'Information par la couleur', url: 'u', theme: 'Couleurs', level: 'A' },
  { id: '4.1', title: 'Média temporel', url: 'u', theme: 'Multimédia', level: 'A' },
];

function makeAudit(overrides: Partial<Audit> = {}): Audit {
  return {
    id: 'audit-1',
    name: 'Site vitrine',
    scope: 'https://exemple.fr',
    mode: 'classic',
    themes: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    progress: {
      '1.1': { status: 'conforme' },
      '1.2': { status: 'non-conforme' },
      '3.1': { status: 'non-applicable' },
    },
    notes: { '1.2': 'Alternative absente.' },
    pages: { '1.2': ['https://exemple.fr/'] },
    checkedTests: { '1.2': ['1.2.1'] },
    ...overrides,
  };
}

/** Tout le texte posé sur le document, aplati — les coordonnées ne nous intéressent pas. */
function writtenText(): string {
  return mockText.mock.calls
    .map(([value]) => (Array.isArray(value) ? value.join(' ') : String(value)))
    .join('\n');
}

/** Les lignes de corps passées à autoTable, tous appels confondus. */
function tableRows(): string[][] {
  return mockAutoTable.mock.calls.flatMap(([, options]) => options.body as string[][]);
}

describe('exportAuditPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.getNumberOfPages.mockReturnValue(3);
    mockDoc.splitTextToSize.mockImplementation((value: string) => [value]);
  });

  it('enregistre un fichier nommé d’après l’audit', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    expect(mockSave).toHaveBeenCalledWith('audit-site-vitrine.pdf');
  });

  it('retombe sur le nom générique quand le nom d’audit ne donne aucun slug', async () => {
    await exportAuditPdf(makeAudit({ name: '???' }), criteria);
    expect(mockSave).toHaveBeenCalledWith('rapport-rgaa.pdf');
  });

  it('déclare la langue et les métadonnées du document', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
    expect(mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('Site vitrine') }),
    );
  });

  it('pose une page de garde avec le nom, le mode, le périmètre et la date', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const text = writtenText();
    expect(text).toContain('Site vitrine');
    expect(text).toContain('Classic');
    expect(text).toContain('https://exemple.fr');
    expect(text).toContain(new Date().toLocaleDateString('fr-FR'));
    // Le bandeau est un aplat, pas une bordure.
    expect(mockRect).toHaveBeenCalled();
  });

  it('affiche le taux, son libellé et sa note en mode classique', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const text = writtenText();
    expect(text).toContain('50 %');
    expect(text).toContain('Taux de conformité');
    expect(text).toContain('non applicables sont exclus du calcul');
  });

  it('nomme le taux selon le mode design system', async () => {
    const audit = makeAudit({
      mode: 'design-system',
      progress: {
        '1.1': { status: 'default-compliant' },
        '1.2': { status: 'project-implementation' },
        '3.1': { status: 'non-applicable' },
      },
    });
    await exportAuditPdf(audit, criteria);
    const text = writtenText();
    expect(text).toContain('Taux de prise en charge par le design system');
    expect(text).toContain('Design System');
  });

  it('écrit les libellés de statut du mode, jamais la couleur seule', async () => {
    const audit = makeAudit({
      mode: 'design-system',
      progress: {
        '1.1': { status: 'default-compliant' },
        '1.2': { status: 'project-implementation' },
      },
    });
    await exportAuditPdf(audit, criteria);
    const rows = tableRows();
    expect(rows.some(row => row.includes('Conforme par défaut'))).toBe(true);
    expect(rows.some(row => row.includes('À mettre en place'))).toBe(true);
  });

  it('dessine une pastille par seau de synthèse et une barre par thème', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    // 4 seaux, et 3 thèmes portant des critères.
    expect(mockRoundedRect.mock.calls.length).toBeGreaterThanOrEqual(4);
    const text = writtenText();
    expect(text).toContain('Images');
    expect(text).toContain('Couleurs');
    expect(text).toContain('Multimédia');
  });

  it('écrit les compteurs de pastille en couleur de texte, pas en couleur de jauge', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const colors = mockDoc.setTextColor.mock.calls.map(c => c.join(','));
    // #404040 pour « non applicable » et « à évaluer » : #9A9A9A et #D6D6D6
    // sont des teintes de jauge, illisibles en texte sur leurs fonds clairs.
    expect(colors).toContain('64,64,64');
    expect(colors).not.toContain('214,214,214');
  });

  it('détaille chaque thème dans son propre tableau', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    expect(mockAutoTable).toHaveBeenCalledTimes(3);
    const rows = tableRows();
    expect(rows.some(row => row[0] === '1.1')).toBe(true);
    // Titre débarrassé de ses liens markdown.
    expect(rows.some(row => row[1].includes('Image de décoration'))).toBe(true);
  });

  it('joint la note, les URLs et les tests cochés au critère', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const cell = tableRows().find(row => row[0] === '1.2')?.[1] ?? '';
    expect(cell).toContain('Alternative absente.');
    expect(cell).toContain('https://exemple.fr/');
    expect(cell).toContain('1.2.1');
  });

  it('marque « À évaluer » un critère sans statut', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const row = tableRows().find(r => r[0] === '4.1');
    expect(row?.[2]).toBe('À évaluer');
  });

  it('numérote les pages', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    expect(mockSetPage).toHaveBeenCalledTimes(3);
    expect(writtenText()).toContain('3 / 3');
  });

  it('remplace les caractères hors WinAnsi plutôt que de produire des glyphes cassés', async () => {
    const audit = makeAudit({ notes: { '1.2': 'Emoji 🎉 et cyrillique Ж' } });
    await exportAuditPdf(audit, criteria);
    const cell = tableRows().find(row => row[0] === '1.2')?.[1] ?? '';
    expect(cell).not.toContain('🎉');
    expect(cell).toContain('?');
  });

  it('conserve les caractères français de WinAnsi', async () => {
    const audit = makeAudit({ notes: { '1.2': 'Œuvre — « déjà vu… »' } });
    await exportAuditPdf(audit, criteria);
    const cell = tableRows().find(row => row[0] === '1.2')?.[1] ?? '';
    expect(cell).toContain('Œuvre — « déjà vu… »');
  });

  it('teinte la cellule de statut selon le statut, sans lui retirer son libellé', async () => {
    const audit = makeAudit({
      progress: {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'non-conforme' },
        '3.1': { status: 'non-applicable' },
      },
    });
    await exportAuditPdf(audit, criteria);

    // Le mock n'exécute pas les hooks d'autoTable : on les rejoue nous-mêmes.
    const colorOf = (criteriaId: string, rowIndex: number) => {
      const call = mockAutoTable.mock.calls.find(([, options]) =>
        (options.body as string[][]).some(row => row[0] === criteriaId),
      );
      const cell = { styles: {} as { textColor?: number[] } };
      call![1].didParseCell({
        section: 'body',
        column: { index: 2 },
        row: { index: rowIndex },
        cell,
      });
      return cell.styles.textColor;
    };

    expect(colorOf('1.1', 0)).toEqual([15, 92, 55]);
    expect(colorOf('1.2', 1)).toEqual([143, 29, 22]);
    expect(colorOf('3.1', 0)).toEqual([154, 154, 154]);
    expect(colorOf('4.1', 0)).toEqual([64, 64, 64]);
  });

  it('laisse les autres cellules à leur style par défaut', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    const cell = { styles: {} as { textColor?: number[] } };
    mockAutoTable.mock.calls[0][1].didParseCell({
      section: 'head',
      column: { index: 2 },
      row: { index: 0 },
      cell,
    });
    expect(cell.styles.textColor).toBeUndefined();
  });

  it('produit un document sur un audit sans aucun critère évalué', async () => {
    const audit = makeAudit({ progress: {}, notes: {}, pages: {}, checkedTests: {} });
    await expect(exportAuditPdf(audit, criteria)).resolves.toBeUndefined();
    expect(writtenText()).toContain('non calculable');
    expect(mockSave).toHaveBeenCalled();
  });

  it('produit un document sur un périmètre vide', async () => {
    await expect(exportAuditPdf(makeAudit({ scope: undefined }), [])).resolves.toBeUndefined();
    expect(mockSave).toHaveBeenCalled();
    expect(mockAutoTable).not.toHaveBeenCalled();
  });

  it('tourne la page quand les barres de thème débordent', async () => {
    // Un thème par critère : la liste des barres dépasse la première page.
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `${i}.1`,
      title: `Critère ${i}`,
      url: 'u',
      theme: `Thème ${i}`,
      level: 'A',
    }));
    await exportAuditPdf(makeAudit({ progress: {} }), many);
    // Une page pour le détail, et au moins une de plus pour la suite des barres.
    expect(mockAddPage.mock.calls.length).toBeGreaterThan(1);
  });
});

describe('exportAuditPdf — provenance du scan', () => {
  const auto = {
    '1.2': {
      status: 'non-conforme' as const,
      testIds: ['1.2.1'],
      scannedAt: '2026-08-20T09:30:00.000Z',
      evidence: [],
    },
    '3.1': {
      status: 'non-applicable' as const,
      testIds: [],
      scannedAt: '2026-08-20T09:30:00.000Z',
      evidence: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mentionne en synthèse le nombre de critères pré-remplis et la date du scan', async () => {
    await exportAuditPdf(makeAudit({ auto }), criteria);
    expect(writtenText()).toContain('2 critères pré-remplis par scan automatique le 20/08/2026');
  });

  it('ne dit rien quand aucun statut ne vient du scan', async () => {
    await exportAuditPdf(makeAudit(), criteria);
    expect(writtenText()).not.toContain('scan automatique');
  });
});
