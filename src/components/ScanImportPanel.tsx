import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Audit, CriteriaRGAA } from '../types';
import { parseScanReport, planScanApplication } from '../utils/scanReport';
import type { ScanPlan, ScanPlanEntry } from '../utils/scanReport';
import { cleanCriteriaTitle } from '../utils/stripMarkdown';
import StatusPill from './StatusPill';

interface ScanImportPanelProps {
  isOpen: boolean;
  audit: Audit;
  /** Critères du périmètre de l'audit — le rapport n'est appliqué qu'à eux. */
  criteriaList: CriteriaRGAA[];
  /** Le référentiel entier : un critère absent de là signale un rapport étranger. */
  knownCriteriaIds: ReadonlySet<string>;
  onApply: (entries: ScanPlanEntry[], scannedAt: string) => void;
  onUndo: (criteriaId: string) => void;
  onClose: () => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Rapport illisible.';
}

/**
 * Import d'un rapport de scan, puis revue de ce qu'il a produit.
 *
 * Le partage des rôles ne se négocie pas : les échecs et les non applicables
 * prouvés sont écrits dès l'import, les conforme proposés attendent une
 * confirmation, et ce que le scan n'a pas regardé est compté à l'écran. Un
 * audit qui tait ses angles morts trompe son lecteur.
 *
 * Aucun appel réseau : le fichier est lu localement, la CSP reste intacte.
 */
export default function ScanImportPanel({
  isOpen,
  audit,
  criteriaList,
  knownCriteriaIds,
  onApply,
  onUndo,
  onClose,
}: ScanImportPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState<ScanPlan | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `showModal` apporte le piège à focus, l'échappement et l'inertie du fond :
  // rien de tout ça n'a besoin d'être réécrit.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const titleOf = (criteriaId: string): string => {
    const criterion = criteriaList.find(candidate => candidate.id === criteriaId);
    return criterion ? cleanCriteriaTitle(criterion.title) : '';
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    // Réimporter le même fichier ne déclenche pas de `change` si la valeur reste.
    event.target.value = '';
    if (!selected) return;

    try {
      const report = parseScanReport(await selected.text(), knownCriteriaIds);
      const next = planScanApplication(report, criteriaList);
      setError(null);
      setPlan(next);
      setScannedAt(report.scannedAt);
      onApply(next.direct, report.scannedAt);
    } catch (caught) {
      // L'audit reste intact : rien n'a été écrit avant que tout soit validé.
      setError(messageOf(caught));
      setPlan(null);
      setScannedAt(null);
    }
  };

  const isApplied = (criteriaId: string): boolean => audit.auto?.[criteriaId] !== undefined;

  const row = (entry: ScanPlanEntry) => {
    const applied = isApplied(entry.criteriaId);
    return (
      <li
        key={entry.criteriaId}
        aria-label={`Critère ${entry.criteriaId}`}
        className="flex flex-col gap-2 border-b border-separator py-3 last:border-0"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-meta text-ink-muted">{entry.criteriaId}</span>
          <span className="min-w-0 flex-1 text-body">{titleOf(entry.criteriaId)}</span>
          <StatusPill status={entry.status} mode="classic" />
          <button
            type="button"
            onClick={() =>
              applied ? onUndo(entry.criteriaId) : onApply([entry], scannedAt ?? '')
            }
            className="target-44 h-ctrl rounded-ctrl border-1 border-border bg-surface px-3 text-dense"
          >
            {applied ? 'Annuler' : 'Appliquer'}
          </button>
        </div>

        {entry.testIds.length > 0 && (
          <p className="font-mono text-meta text-ink-muted">
            Test{entry.testIds.length > 1 ? 's' : ''} {entry.testIds.join(', ')}
          </p>
        )}

        {entry.evidence.map((evidence, index) => (
          <div key={index} className="rounded-ctrl bg-sunk p-3 text-meta">
            <p className="break-all font-mono">{evidence.url}</p>
            {evidence.selector && <p className="break-all font-mono text-ink-muted">{evidence.selector}</p>}
            {evidence.snippet && (
              <pre className="mt-1 overflow-x-auto font-mono text-ink-muted">{evidence.snippet}</pre>
            )}
          </div>
        ))}
      </li>
    );
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="scan-import-title"
      className="m-auto w-full max-w-2xl rounded-card bg-surface p-0 text-ink shadow-panel backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-separator p-4">
        <h2 id="scan-import-title" className="text-lead font-semibold">
          Importer un rapport de scan
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="target-44 flex h-ctrl w-ctrl items-center justify-center rounded-ctrl"
          aria-label="Fermer l’import de scan"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
        <div>
          <label htmlFor="scan-report-file" className="mb-2 block text-body font-semibold">
            Rapport de scan (JSON)
          </label>
          <p id="scan-report-help" className="mb-2 text-dense text-ink-muted">
            Produit par <code className="font-mono">pnpm scan</code> sur un échantillon de pages.
            Le fichier est lu ici même, sans qu’aucune donnée ne sorte du navigateur.
          </p>
          <input
            id="scan-report-file"
            type="file"
            accept="application/json,.json"
            aria-describedby="scan-report-help"
            onChange={handleFile}
            className="w-full rounded-ctrl border-1 border-border bg-surface p-2 text-dense"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-ctrl bg-ko-bg p-3 text-dense text-ko-fg">
            Import refusé — {error} L’audit est inchangé.
          </p>
        )}

        {plan && (
          <>
            <div role="group" aria-labelledby="scan-direct-title">
              <h3 id="scan-direct-title" className="text-body font-semibold">
                Appliqué automatiquement — {plan.direct.length} critère
                {plan.direct.length > 1 ? 's' : ''}
              </h3>
              <p className="text-dense text-ink-muted">
                Échecs et non applicables prouvés, écrits dans l’audit avec leur preuve.
              </p>
              <ul>{plan.direct.map(row)}</ul>
            </div>

            <div role="group" aria-labelledby="scan-proposed-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="scan-proposed-title" className="text-body font-semibold">
                  À confirmer — {plan.proposed.length} conforme
                  {plan.proposed.length > 1 ? 's' : ''} proposé
                  {plan.proposed.length > 1 ? 's' : ''}
                </h3>
                {plan.proposed.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onApply(
                        plan.proposed.filter(entry => !isApplied(entry.criteriaId)),
                        scannedAt ?? '',
                      )
                    }
                    className="target-44 h-ctrl rounded-ctrl border-1 border-border bg-surface px-3 text-dense"
                  >
                    Tout accepter
                  </button>
                )}
              </div>
              <p className="text-dense text-ink-muted">
                « Rien trouvé dans les états scannés » ne prouve pas la conformité : rien n’est
                écrit sans votre accord.
              </p>
              <ul>{plan.proposed.map(row)}</ul>
            </div>

            <div role="group" aria-labelledby="scan-unscanned-title">
              <h3 id="scan-unscanned-title" className="text-body font-semibold">
                Non évalué par le scan
              </h3>
              <p className="text-dense text-ink-muted">
                {plan.unscanned} critère{plan.unscanned > 1 ? 's' : ''} du périmètre restent à
                évaluer à la main — le scan ne les a pas tranchés.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end border-t border-separator p-4">
        <button
          type="button"
          onClick={onClose}
          className="target-44 h-ctrl rounded-ctrl border-1 border-border bg-surface px-3 text-body"
        >
          Terminer
        </button>
      </div>
    </dialog>
  );
}
