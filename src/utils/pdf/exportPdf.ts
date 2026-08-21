import type { Audit, CriteriaRGAA, CriteriaStatus } from '../../types';
import type jsPDF from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';
import { calculateSummaryStats } from '../calculateSummaryStats';
import type { ThemeStats } from '../calculateSummaryStats';
import { toSummaryView, themeCounts } from '../summaryView';
import type { SummaryView } from '../summaryView';
import { getStatusPresentation } from '../statusPresentation';
import { cleanCriteriaTitle } from '../stripMarkdown';
import { PDF_FILENAME } from '../../constants';
import { PDF_RGB, BUCKET_RGB, BUCKET_BG_RGB, BUCKET_FG_RGB, PDF_LAYOUT } from './theme';
import type { Rgb } from './theme';

/**
 * Le rapport PDF remis au client.
 *
 * Limite connue, et gênante pour un outil d'accessibilité : jsPDF ne produit
 * pas de PDF balisé. Le document déclare sa langue et ses métadonnées, mais
 * n'expose ni structure de titres ni ordre de lecture à un lecteur d'écran.
 * L'export Markdown reste le livrable réellement accessible ; celui-ci est un
 * document de mise en forme. Le corriger demanderait une autre bibliothèque —
 * voir T-0043, où le sujet du moteur PDF a déjà été tranché une fois.
 */

interface JSPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

type AutoTable = (doc: jsPDF, options: UserOptions) => void;

/**
 * Les polices standard de jsPDF encodent en WinAnsi (cp1252). Ce qui en sort —
 * emoji, cyrillique, CJK — produit des glyphes cassés dans le document. Les
 * caractères français hors latin-1 (œ, guillemets, tirets longs, points de
 * suspension) sont, eux, bien dans cp1252 : ils passent.
 *
 * ponytail: substitution par `?`, suffisante pour une note d'audit rédigée en
 * français. Embarquer une police TTF Unicode est la sortie si des notes en
 * alphabet non latin apparaissent.
 */
const CP1252_HIGH = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

function sanitizeWinAnsi(text: string): string {
  return [...text]
    .map(char => (char.codePointAt(0)! < 256 || CP1252_HIGH.includes(char) ? char : '?'))
    .join('');
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function modeLabel(audit: Audit): string {
  return audit.mode === 'classic' ? 'Classic' : 'Design System';
}

function statusOf(audit: Audit, criteriaId: string): CriteriaStatus | undefined {
  return audit.progress[criteriaId as keyof typeof audit.progress]?.status;
}

function rateText(view: SummaryView): string {
  return view.rate === null ? 'non calculable' : `${Math.round(view.rate)} %`;
}

/** Un curseur vertical partagé, qui sait tourner la page. */
function makeCursor(doc: jsPDF) {
  return {
    y: PDF_LAYOUT.margin as number,
    /** Réserve `height` millimètres, en changeant de page s'ils ne tiennent plus. */
    need(height: number) {
      if (this.y + height > PDF_LAYOUT.bottomLimit) {
        doc.addPage();
        this.y = PDF_LAYOUT.margin;
      }
    },
  };
}

type Cursor = ReturnType<typeof makeCursor>;

function fill(doc: jsPDF, color: Rgb) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function ink(doc: jsPDF, color: Rgb) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function drawCover(doc: jsPDF, audit: Audit) {
  const { margin, pageWidth, bannerHeight, contentWidth } = PDF_LAYOUT;

  fill(doc, PDF_RGB.ink);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  ink(doc, PDF_RGB.surface);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  const title = doc.splitTextToSize(sanitizeWinAnsi(audit.name), contentWidth);
  doc.text(title.slice(0, 2), margin, 28);

  ink(doc, PDF_RGB.bannerMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Audit RGAA 4.1.2 · ${modeLabel(audit)}`, margin, 44);

  const scope = audit.scope ? sanitizeWinAnsi(audit.scope) : 'Périmètre non renseigné';
  doc.setFontSize(9);
  doc.text(`${scope} · ${new Date().toLocaleDateString('fr-FR')}`, margin, 53);
}

/** « 2 critères pré-remplis par scan automatique le 20/08/2026 », ou rien. */
function autoLine(audit: Audit, criteria: CriteriaRGAA[]): string | null {
  const entries = criteria.map(c => audit.auto?.[c.id]).filter(entry => entry !== undefined);
  if (entries.length === 0) return null;

  const scannedAt = entries.map(entry => entry.scannedAt).sort().at(-1)!;
  const date = new Date(scannedAt).toLocaleDateString('fr-FR');
  const plural = entries.length > 1 ? 's' : '';
  return `${entries.length} critère${plural} pré-rempli${plural} par scan automatique le ${date}`;
}

function drawSummary(doc: jsPDF, cursor: Cursor, view: SummaryView, auto: string | null) {
  const { margin, contentWidth, radiusCtrl } = PDF_LAYOUT;
  cursor.y = PDF_LAYOUT.bannerHeight + 18;

  ink(doc, PDF_RGB.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.text(rateText(view), margin, cursor.y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(view.rateLabel, margin, cursor.y + 9);

  ink(doc, PDF_RGB.inkMuted);
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(view.rateNote, contentWidth), margin, cursor.y + 16);
  cursor.y += 28;

  // Quatre pastilles : le compteur, puis son libellé. Le libellé est écrit,
  // jamais remplacé par la seule teinte de la pastille.
  const pillWidth = (contentWidth - 3 * 4) / 4;
  view.buckets.forEach((bucket, index) => {
    const x = margin + index * (pillWidth + 4);
    fill(doc, BUCKET_BG_RGB[bucket.key]);
    doc.roundedRect(x, cursor.y, pillWidth, 18, radiusCtrl, radiusCtrl, 'F');

    ink(doc, BUCKET_FG_RGB[bucket.key]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(String(bucket.count), x + 4, cursor.y + 9);

    ink(doc, PDF_RGB.inkMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(bucket.label, pillWidth - 8)[0], x + 4, cursor.y + 15);
  });
  cursor.y += 28;

  // L'origine d'un statut compte le plus dans le document remis : sans cette
  // ligne, le rapport présente comme humaine une décision de machine.
  if (auto) {
    ink(doc, PDF_RGB.inkMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(auto, margin, cursor.y);
    cursor.y += 8;
  }
}

function drawThemeBars(doc: jsPDF, cursor: Cursor, byTheme: ThemeStats[]) {
  const { margin, contentWidth } = PDF_LAYOUT;
  const barWidth = contentWidth - 78;

  ink(doc, PDF_RGB.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Par thème', margin, cursor.y);
  cursor.y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const theme of byTheme) {
    const counts = themeCounts(theme);
    if (counts.total === 0) continue;
    cursor.need(9);

    ink(doc, PDF_RGB.inkMuted);
    doc.text(doc.splitTextToSize(sanitizeWinAnsi(theme.theme), 58)[0], margin, cursor.y + 3);

    let x = margin + 60;
    const segments = [
      [counts.conforme, BUCKET_RGB.conforme],
      [counts.ecarts, BUCKET_RGB.ecarts],
      [counts.nonApplicable, BUCKET_RGB.nonApplicable],
      [counts.aEvaluer, BUCKET_RGB.aEvaluer],
    ] as const;

    for (const [count, color] of segments) {
      if (count === 0) continue;
      const width = (count / counts.total) * barWidth;
      fill(doc, color);
      doc.rect(x, cursor.y, width, 4, 'F');
      x += width;
    }

    ink(doc, PDF_RGB.inkMuted);
    doc.text(`${counts.conforme + counts.ecarts + counts.nonApplicable}/${counts.total}`, margin + 62 + barWidth, cursor.y + 3);
    cursor.y += 9;
  }
}

/** Le titre du critère, puis ce que l'auditeur y a attaché. Une cellule, plusieurs lignes. */
function detailCell(audit: Audit, criteria: CriteriaRGAA): string {
  const lines = [cleanCriteriaTitle(criteria.title)];
  const note = audit.notes[criteria.id];
  const pages = audit.pages[criteria.id] ?? [];
  const tests = audit.checkedTests[criteria.id] ?? [];

  if (note) lines.push(note);
  if (pages.length > 0) lines.push(`Pages : ${pages.join(', ')}`);
  if (tests.length > 0) lines.push(`Tests validés : ${tests.join(', ')}`);
  return sanitizeWinAnsi(lines.join('\n'));
}

function statusRgb(status: CriteriaStatus | undefined): Rgb {
  if (status === 'conforme' || status === 'default-compliant') return PDF_RGB.ok;
  if (status === 'non-conforme' || status === 'project-implementation') return PDF_RGB.ko;
  if (status === 'non-applicable') return PDF_RGB.na;
  return PDF_RGB.todo;
}

function drawDetail(
  doc: JSPDFWithAutoTable,
  autoTable: AutoTable,
  cursor: Cursor,
  audit: Audit,
  criteria: CriteriaRGAA[],
) {
  const { margin, contentWidth } = PDF_LAYOUT;
  const themes = [...new Set(criteria.map(c => c.theme))];
  if (themes.length === 0) return;

  doc.addPage();
  cursor.y = margin;

  for (const theme of themes) {
    cursor.need(24);
    ink(doc, PDF_RGB.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sanitizeWinAnsi(theme), margin, cursor.y + 4);
    cursor.y += 8;

    const themeCriteria = criteria.filter(c => c.theme === theme);
    const rows = themeCriteria
      .map(c => [
        c.id,
        detailCell(audit, c),
        getStatusPresentation(statusOf(audit, c.id), audit.mode).label,
      ]);

    autoTable(doc, {
      head: [['Nº', 'Critère', 'Statut']],
      body: rows,
      startY: cursor.y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: { fontSize: 8, cellPadding: 2, textColor: [...PDF_RGB.ink], lineColor: [...PDF_RGB.border] },
      headStyles: { fillColor: [...PDF_RGB.ink], textColor: [...PDF_RGB.surface], fontSize: 8 },
      alternateRowStyles: { fillColor: [...PDF_RGB.sunk] },
      columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 34 } },
      didParseCell: hook => {
        // La couleur double le libellé, elle ne le remplace pas : la cellule
        // porte toujours « Conforme », « Non conforme », « À évaluer »…
        if (hook.section === 'body' && hook.column.index === 2) {
          const status = statusOf(audit, themeCriteria[hook.row.index].id);
          hook.cell.styles.textColor = [...statusRgb(status)];
        }
      },
    });

    cursor.y = (doc.lastAutoTable?.finalY ?? cursor.y) + 10;
  }
}

function drawFooters(doc: jsPDF, audit: Audit) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    ink(doc, PDF_RGB.inkMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `${sanitizeWinAnsi(audit.name)} · ${page} / ${total}`,
      PDF_LAYOUT.margin,
      PDF_LAYOUT.pageHeight - 8,
    );
  }
}

export async function exportAuditPdf(audit: Audit, criteria: CriteriaRGAA[]): Promise<void> {
  // Import différé : la chaîne jsPDF pèse plusieurs centaines de kilooctets et
  // ne doit pas entrer dans le bundle initial.
  const [jsPDFModule, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const JsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default as AutoTable;

  const doc = new JsPDF() as JSPDFWithAutoTable;
  const stats = calculateSummaryStats(criteria, audit.progress, audit.mode);
  const view = toSummaryView(stats, audit.mode);

  doc.setLanguage('fr');
  doc.setProperties({
    title: `Rapport RGAA — ${audit.name}`,
    subject: `Audit d'accessibilité RGAA 4.1.2 (${modeLabel(audit)})`,
    creator: 'Accessipote',
  });

  const cursor = makeCursor(doc);
  drawCover(doc, audit);
  drawSummary(doc, cursor, view, autoLine(audit, criteria));
  drawThemeBars(doc, cursor, stats.byTheme);
  drawDetail(doc, autoTable, cursor, audit, criteria);
  drawFooters(doc, audit);

  const slug = slugify(audit.name);
  doc.save(slug ? `audit-${slug}.pdf` : PDF_FILENAME);
}
