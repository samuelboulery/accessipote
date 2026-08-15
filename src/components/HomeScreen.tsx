import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Audit } from '../types';
import AuditRing from './AuditRing';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export interface AuditSummary {
  audit: Audit;
  evaluated: number;
  total: number;
}

interface HomeScreenProps {
  audits: AuditSummary[];
  /** Sert le texte de l'invitation quand aucun audit n'existe. */
  criteriaCount: number;
  onOpenAudit: (auditId: string) => void;
  onCreateAudit: () => void;
  onDeleteAudit: (auditId: string) => void;
}

const MODE_LABEL = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
} as const;

/**
 * Ne porte plus que les audits : le titre et l'accroche sont remontés hors du
 * panneau, dans HomeHero.
 */
export default function HomeScreen({
  audits,
  criteriaCount,
  onOpenAudit,
  onCreateAudit,
  onDeleteAudit,
}: HomeScreenProps) {
  // Confirmation en place plutôt qu'une modale : la suppression est
  // irréversible — il n'y a pas de backend pour récupérer un audit effacé.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const hasAudits = audits.length > 0;


  return (
    <div className="flex min-h-full flex-col gap-4">
        <h2 className="text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Tes audits
        </h2>

        {hasAudits ? (
          <ul className="grid gap-3 xl:grid-cols-2">
            {audits.map(({ audit, evaluated, total }) => {
              const share = total > 0 ? evaluated / total : 0;
              const percentage = Math.round(share * 100);
              const isPendingDelete = pendingDeleteId === audit.id;

              return (
                <li key={audit.id} className="rounded-card bg-sunk p-4">
                  {isPendingDelete ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="min-w-0 flex-1 text-body">
                        Supprimer « {audit.name} » ?
                        <span className="block text-dense text-ink-muted">
                          {evaluated > 0
                            ? `Ses ${evaluated} critère${evaluated > 1 ? 's' : ''} évalué${evaluated > 1 ? 's' : ''}, ses notes et ses pages seront perdus.`
                            : 'Ses notes et ses pages seront perdues.'}{' '}
                          Rien ne permet de les récupérer.
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="target-44 h-ctrl flex-shrink-0 rounded-ctrl border-1 border-border bg-surface px-3 text-body"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteAudit(audit.id);
                          setPendingDeleteId(null);
                        }}
                        className="target-44 flex h-ctrl flex-shrink-0 items-center gap-2 rounded-ctrl bg-ko px-3 text-body font-semibold text-surface"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenAudit(audit.id)}
                        className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-4 text-left sm:grid-cols-[48px_1fr_auto]"
                      >
                        {/* Sur téléphone l'anneau part : il redit le pourcentage
                            écrit juste à côté, et ses 48px manquaient au nom de
                            l'audit, tronqué dès le deuxième mot. */}
                        <span className="hidden sm:block">
                          <AuditRing
                            size={48}
                            segments={[{ key: 'evalues', share, color: 'var(--a-ink)' }]}
                            label={`${percentage} % évalué`}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-lead font-semibold">
                            {audit.name}
                          </span>
                          <span className="mt-1 block text-dense text-ink-muted">
                            {MODE_LABEL[audit.mode]} · modifié {formatRelativeTime(audit.updatedAt)}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block font-mono text-body font-semibold">
                            {percentage}%
                          </span>
                          <span className="mt-1 block font-mono text-meta text-ink-muted">
                            {evaluated} / {total}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(audit.id)}
                        aria-label={`Supprimer l'audit ${audit.name}`}
                        className="target-44 flex h-ctrl w-ctrl flex-shrink-0 items-center justify-center rounded-ctrl text-ink-muted"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          // Au premier lancement, la liste absente laissait un creux là où il
          // fallait justement guider.
          <div className="rounded-card border-1 border-dashed p-6">
            <p className="text-lead font-semibold">Aucun audit pour l'instant.</p>
            <p className="mt-2 text-body text-ink-muted">
              Un audit, c'est les {criteriaCount} critères à statuer, que tu remplis à ton rythme.
              Tu peux t'arrêter et reprendre quand tu veux.
            </p>
            <button
              type="button"
              onClick={onCreateAudit}
              className="mt-4 flex h-prim items-center justify-center gap-2 rounded-ctrl bg-ink px-6 text-lead font-semibold text-surface"
            >
              <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
              Démarrer un premier audit
            </button>
          </div>
        )}

        {hasAudits && (
          <button
            type="button"
            onClick={onCreateAudit}
            className="mt-auto flex h-prim items-center justify-center gap-2 self-start rounded-ctrl bg-ink px-6 text-lead font-semibold text-surface"
          >
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            Nouvel audit
          </button>
        )}

    </div>
  );
}
