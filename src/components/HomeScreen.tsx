import { Plus, ChevronRight, BookOpen } from 'lucide-react';
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
}

const MODE_LABEL = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
} as const;

/**
 * Ni tuile de logo ni mot-symbole ici : la barre latérale les porte déjà, les
 * répéter ne dit rien de plus.
 */
export default function HomeScreen({
  audits,
  glossaryCount,
  criteriaCount,
  onOpenAudit,
  onCreateAudit,
  onOpenGlossary,
}: HomeScreenProps) {
  const hasAudits = audits.length > 0;

  return (
    <div className="flex min-h-full flex-col justify-between gap-8 rounded-card bg-bg p-6">
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

                return (
                  <li key={audit.id}>
                    <button
                      type="button"
                      onClick={() => onOpenAudit(audit.id)}
                      className="grid w-full grid-cols-[48px_1fr_auto_16px] items-center gap-4 rounded-card border-1 border-border bg-surface p-4 text-left"
                    >
                      <AuditRing
                        size={48}
                        segments={[{ key: 'evalues', share, color: 'var(--a-ink)' }]}
                        label={`${percentage} % évalué`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-lead font-semibold">{audit.name}</span>
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
                      <ChevronRight size={16} aria-hidden="true" className="text-ink-muted" />
                    </button>
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
