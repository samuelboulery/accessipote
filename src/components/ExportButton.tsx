import { useState } from 'react';
import type React from 'react';
import type { Mode, Progress, CriteriaRGAA } from '../types';
import { exportClassicMarkdown, exportDesignSystemMarkdown } from '../utils/exportMarkdown';
import { PDF_Y_POS_LIMIT, PDF_START_Y_POS, PDF_HEADER_Y_POS, PDF_FILENAME } from '../constants';
import { cleanCriteriaTitle } from '../utils/stripMarkdown';
import { logError } from '../utils/logger';
import { Download, Copy } from 'lucide-react';
import type jsPDF from 'jspdf';

// Interface pour étendre jsPDF avec autoTable
interface JSPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface ExportButtonProps {
  mode: Mode;
  progress: Progress;
  criteriaList: CriteriaRGAA[];
  onShowToast: (message: string, type: 'success' | 'error') => void;
  exportMarkdownButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function ExportButton({ mode, progress, criteriaList, onShowToast, exportMarkdownButtonRef }: ExportButtonProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportMarkdown = () => {
    // Filtrer uniquement les critères qui ont un statut
    let content = '';
    if (mode === 'classic') {
      const classicCriteria = criteriaList.filter(c => progress.classic[c.id]);
      content = exportClassicMarkdown(progress.classic, classicCriteria);
    } else {
      const designSystemCriteria = criteriaList.filter(c => progress.designSystem[c.id]);
      content = exportDesignSystemMarkdown(progress.designSystem, designSystemCriteria);
    }

    // Copier le contenu dans le presse-papiers
    navigator.clipboard.writeText(content).then(() => {
      onShowToast('Contenu copié dans le presse-papiers !', 'success');
    }).catch(() => {
      // Fallback: télécharger le fichier si la copie échoue
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'classic' ? 'rapport-rgaa.md' : 'checklist-design-system.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleExportPDF = async () => {
    if (mode === 'classic') {
      setIsExportingPDF(true);
      try {
        // Dynamic import pour charger jsPDF uniquement quand nécessaire
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);

        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;
        const classicCriteria = criteriaList.filter(c => progress.classic[c.id]);
        
        const doc = new jsPDF() as JSPDFWithAutoTable;
        
        doc.setFontSize(16);
        doc.text('Rapport de Conformité RGAA - Accessipote', 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

        const groupedCriteria = {
          conforme: [] as CriteriaRGAA[],
          'non-conforme': [] as CriteriaRGAA[],
          'non-applicable': [] as CriteriaRGAA[],
        };

        classicCriteria.forEach(criteria => {
          const status = progress.classic[criteria.id]?.status;
          if (status && groupedCriteria[status as keyof typeof groupedCriteria]) {
            groupedCriteria[status as keyof typeof groupedCriteria].push(criteria);
          }
        });

        let yPos = PDF_START_Y_POS;

        const addSection = (title: string, criteriaArray: CriteriaRGAA[]) => {
          if (criteriaArray.length === 0) return;
          
          if (yPos > PDF_Y_POS_LIMIT) {
            doc.addPage();
            yPos = PDF_HEADER_Y_POS;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(title, 14, yPos);
          yPos += 10;

          const data = criteriaArray.map(criteria => {
            const cleanTitle = cleanCriteriaTitle(criteria.title);
            return [criteria.id, cleanTitle, criteria.level];
          });

          autoTable(doc, {
            head: [['ID', 'Titre', 'Niveau']],
            body: data,
            startY: yPos,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [66, 139, 202], textColor: 255 },
          });

          const finalY = doc.lastAutoTable?.finalY;
          yPos = finalY ? finalY + 15 : yPos + 15;
        };

        addSection('Critères Conformes', groupedCriteria.conforme);
        addSection('Critères Non Conformes', groupedCriteria['non-conforme']);
        addSection('Critères Non Applicables', groupedCriteria['non-applicable']);

        doc.save(PDF_FILENAME);
      } catch (error) {
        // Le message utilisateur reste générique, mais l'erreur d'origine doit
        // rester lisible : sans elle, un export qui échoue ne laisse aucune trace.
        logError('Export PDF impossible:', error);
        onShowToast('Erreur lors de l\'export PDF. Veuillez réessayer.', 'error');
      } finally {
        setIsExportingPDF(false);
      }
    }
  };

  return (
    <div className="flex flex-shrink-0 gap-2">
      <button
        ref={exportMarkdownButtonRef}
        onClick={handleExportMarkdown}
        aria-keyshortcuts="Control+e Meta+e"
        className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl bg-ink px-3 text-body font-semibold text-surface"
      >
        <Copy size={16} aria-hidden="true" />
        Exporter
      </button>
      {mode === 'classic' && (
        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body disabled:opacity-50"
        >
          <Download size={16} aria-hidden="true" />
          {isExportingPDF ? 'Export…' : 'PDF'}
        </button>
      )}
    </div>
  );
}
