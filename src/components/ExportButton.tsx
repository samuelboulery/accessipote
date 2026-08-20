import { useState } from 'react';
import type React from 'react';
import type { Audit, CriteriaRGAA } from '../types';
import { renderTemplate } from '../utils/markdownTemplate';
import { useMarkdownTemplate } from '../hooks/useMarkdownTemplate';
import { exportAuditPdf } from '../utils/pdf/exportPdf';
import { logError } from '../utils/logger';
import { Download, Copy } from 'lucide-react';

interface ExportButtonProps {
  audit: Audit;
  criteriaList: CriteriaRGAA[];
  onShowToast: (message: string, type: 'success' | 'error') => void;
  exportMarkdownButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function ExportButton({ audit, criteriaList, onShowToast, exportMarkdownButtonRef }: ExportButtonProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { template } = useMarkdownTemplate(audit.mode);

  const handleExportMarkdown = () => {
    // Le gabarit sort du hook déjà validé : une valeur douteuse dans
    // localStorage y est retombée sur le défaut.
    const content = renderTemplate(template, { audit, criteria: criteriaList });

    navigator.clipboard.writeText(content).then(() => {
      onShowToast('Contenu copié dans le presse-papiers !', 'success');
    }).catch(() => {
      // Fallback: télécharger le fichier si la copie échoue
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = audit.mode === 'classic' ? 'rapport-rgaa.md' : 'checklist-design-system.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportAuditPdf(audit, criteriaList);
    } catch (error) {
      // Le message utilisateur reste générique, mais l'erreur d'origine doit
      // rester lisible : sans elle, un export qui échoue ne laisse aucune trace.
      logError('Export PDF impossible:', error);
      onShowToast('Erreur lors de l\'export PDF. Veuillez réessayer.', 'error');
    } finally {
      setIsExportingPDF(false);
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
        Copier en Markdown
      </button>
      <button
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body disabled:opacity-50"
      >
        <Download size={16} aria-hidden="true" />
        {isExportingPDF ? 'Export…' : 'PDF'}
      </button>
    </div>
  );
}
