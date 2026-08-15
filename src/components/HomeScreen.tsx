import { useState } from 'react';
import { Plus, ChevronRight, BookOpen, Trash2 } from 'lucide-react';
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
  glossaryCount: number;
  criteriaCount: number;
  onOpenAudit: (auditId: string) => void;
  onCreateAudit: () => void;
  onOpenGlossary: () => void;
  onDeleteAudit: (auditId: string) => void;
}

const MODE_LABEL = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
} as const;

/**
 * Pas de cadre ici : l'écran s'assoit directement sur la surface du panneau.
 * Un conteneur arrondi dans un conteneur arrondi n'ajoutait qu'une épaisseur.
 */
export default function HomeScreen({
  audits,
  glossaryCount,
  criteriaCount,
  onOpenAudit,
  onCreateAudit,
  onOpenGlossary,
  onDeleteAudit,
}: HomeScreenProps) {
  // Confirmation en place plutôt qu'une modale : la suppression est
  // irréversible — il n'y a pas de backend pour récupérer un audit effacé.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const hasAudits = audits.length > 0;

  return (
    <div className="flex min-h-full flex-col justify-between gap-8">
      <header className="max-w-[52ch]">
        <p className="font-mono text-meta uppercase tracking-[0.08em] text-ink-muted">RGAA 4.1</p>
        <h1 className="mt-2 text-screen font-semibold [text-wrap:balance]">
          Ton pote qui connaît le RGAA par cœur.
        </h1>
        <p className="mt-3 text-lead text-ink-muted">
          Les {criteriaCount} critères, thème par thème, sans que tu aies à retenir lequel vient
          après lequel. Tu nommes ton audit, tu le reprends quand tu veux, et tes notes comme tes
          pages restent dans ce navigateur — rien ne part ailleurs.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {hasAudits && (
          <div>
            <h2 className="mb-3 text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Tes audits
            </h2>
            <ul className="flex flex-col gap-3">
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
                          className="grid min-w-0 flex-1 grid-cols-[48px_1fr_auto_16px] items-center gap-4 text-left"
                        >
                          <AuditRing
                            size={48}
                            segments={[{ key: 'evalues', share, color: 'var(--a-ink)' }]}
                            label={`${percentage} % évalué`}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-lead font-semibold">
                              {audit.name}
                            </span>
                            <span className="mt-1 block text-dense text-ink-muted">
                              {MODE_LABEL[audit.mode]} · modifié{' '}
                              {formatRelativeTime(audit.updatedAt)}
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
                          <ChevronRight size={16} aria-hidden="true" className="text-ink-muted" />
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
          </div>
        )}

        {/* Pleine largeur en tactile seulement : sur desktop un bouton étiré sur
            tout le panneau est disproportionné. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onCreateAudit}
            className="flex h-prim items-center justify-center gap-2 rounded-ctrl bg-ink px-6 text-lead font-semibold text-surface"
          >
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            {hasAudits ? 'Nouvel audit' : 'Démarrer un premier audit'}
          </button>
          <button
            type="button"
            onClick={onOpenGlossary}
            className="flex h-prim items-center justify-center gap-2 rounded-ctrl border-1 border-border bg-surface px-6 text-body"
          >
            <BookOpen size={16} aria-hidden="true" />
            Glossaire
            <span className="font-mono text-meta text-ink-muted">{glossaryCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
