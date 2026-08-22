import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Mode } from '../types';
import { useMarkdownTemplate } from '../hooks/useMarkdownTemplate';
import { isValidTemplate, renderTemplate, TEMPLATE_MAX_LENGTH } from '../utils/markdownTemplate';
import type { TemplateData } from '../utils/markdownTemplate';

interface ExportSettingsModalProps {
  isOpen: boolean;
  /** Le gabarit édité est celui du mode de l'audit ouvert : les deux ne rendent pas le même rapport. */
  mode: Mode;
  /** L'audit sur lequel prévisualiser. `null` quand aucun n'est ouvert. */
  previewData: TemplateData | null;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Ce que l'auteur d'un gabarit peut écrire. Sans cette liste, la grammaire se devine. */
const TOKENS: Array<[string, string]> = [
  ['{{nomAudit}}', 'Nom de l’audit'],
  ['{{périmètre}}', 'Périmètre saisi à la création'],
  ['{{date}}', 'Date du jour'],
  ['{{mode}}', 'Classic ou Design System'],
  ['{{taux}}', 'Taux, ou « non calculable »'],
  ['{{libelléTaux}}', 'Nom du taux selon le mode'],
  ['{{évalués}} / {{total}}', 'Critères évalués et total'],
  ['{{préRemplis}}', 'Critères pré-remplis par le scan'],
  ['{{dateScan}}', 'Date du dernier scan importé'],
  ['{{#critères}}…{{/critères}}', 'Répète le bloc sur les critères évalués'],
  ['{{#critères:ok}}…{{/critères}}', 'Conformes seulement'],
  ['{{#critères:ecarts}}…{{/critères}}', 'Écarts seulement'],
  ['{{#critères:na}}…{{/critères}}', 'Non applicables seulement'],
  ['{{#critères:aEvaluer}}…{{/critères}}', 'Restant à évaluer'],
];

/** Jetons utilisables à l'intérieur d'un bloc de critères. */
const CRITERIA_TOKENS =
  '{{id}} · {{titre}} · {{statut}} · {{niveau}} · {{thème}} · {{description}} · {{note}} · {{urls}} · {{tests}} · {{provenance}}';

export default function ExportSettingsModal({ isOpen, mode, previewData, onClose }: ExportSettingsModalProps) {
  const { template, setTemplate, reset } = useMarkdownTemplate(mode);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Une saisie valide EST le gabarit : elle descend dans le stockage et remonte
  // par le hook. Seule une saisie invalide vit à part, le temps que l'auteur
  // finisse sa phrase — éditer un gabarit, c'est le casser à moitié tout le
  // temps qu'on l'écrit.
  const [invalidDraft, setInvalidDraft] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
      });
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const draft = invalidDraft ?? template;
  const valid = invalidDraft === null;

  const handleChange = (value: string) => {
    if (isValidTemplate(value)) {
      setInvalidDraft(null);
      setTemplate(value);
    } else {
      setInvalidDraft(value);
    }
  };

  const handleReset = () => {
    setInvalidDraft(null);
    reset();
  };

  const preview = !valid
    ? ''
    : previewData
      ? renderTemplate(draft, previewData)
      : 'Ouvrez un audit pour prévisualiser le rendu de ce gabarit — aucun audit n’est actif.';

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-settings-title"
        className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-surface shadow-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-separator p-4">
          <h2 id="export-settings-title" className="text-lead font-semibold">
            Personnaliser l’export Markdown
          </h2>
          <button
            onClick={onClose}
            className="target-44 flex h-ctrl w-ctrl items-center justify-center rounded-ctrl"
            aria-label="Fermer les paramètres d’export"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label htmlFor="export-template" className="mb-1 block text-body font-semibold">
              Gabarit Markdown — mode {mode === 'classic' ? 'Classic' : 'Design System'}
            </label>
            <p id="export-template-help" className="mb-2 text-meta text-ink-muted">
              Ce gabarit sert à chaque copie. Il est enregistré au fil de la frappe.
            </p>
            <textarea
              id="export-template"
              aria-describedby="export-template-help"
              aria-invalid={!valid}
              value={draft}
              rows={12}
              maxLength={TEMPLATE_MAX_LENGTH}
              onChange={e => handleChange(e.target.value)}
              className="w-full rounded-ctrl border-1 border-border bg-sunk p-3 font-mono text-dense"
            />
            {!valid && (
              <p role="alert" className="mt-1 text-meta text-ko-fg">
                Un bloc {'{{#critères}}'} n’est pas fermé par {'{{/critères}}'}, ou le gabarit dépasse{' '}
                {TEMPLATE_MAX_LENGTH} caractères. La dernière version valide reste employée à l’export.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Jetons disponibles
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {TOKENS.map(([token, description]) => (
                <div key={token} className="flex min-w-0 items-baseline gap-2">
                  <dt className="shrink-0 font-mono text-meta">{token}</dt>
                  <dd className="truncate text-meta text-ink-muted">{description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-meta text-ink-muted">
              Dans un bloc : <span className="font-mono">{CRITERIA_TOKENS}</span>
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Prévisualisation
            </h3>
            <pre
              data-testid="template-preview"
              aria-live="polite"
              className="max-h-64 overflow-auto whitespace-pre-wrap rounded-ctrl border-1 border-border bg-sunk p-3 font-mono text-meta"
            >
              {preview}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-separator p-4">
          <button
            onClick={handleReset}
            className="target-44 flex h-ctrl items-center rounded-ctrl border-1 border-border bg-surface px-3 text-body"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="target-44 flex h-ctrl items-center rounded-ctrl bg-ink px-3 text-body font-semibold text-surface"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
}
