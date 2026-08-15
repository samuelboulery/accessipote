import { memo } from 'react';
import { Home, List, BarChart3, BookOpen, ChevronsUpDown, Check } from 'lucide-react';
import type { Audit, Mode } from '../types';
import AccessipoteLogo from './AccessipoteLogo';
import AuditRing from './AuditRing';
import { getStatusPresentation, UNSET_STATUS } from '../utils/statusPresentation';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export type View = 'home' | 'audit' | 'summary' | 'glossary';

export interface StatusCounts {
  conforme: number;
  ecarts: number;
  nonApplicable: number;
  aEvaluer: number;
}

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
  activeAudit: Audit | null;
  /** Répartition des critères de l'audit actif. */
  counts: StatusCounts;
  total: number;
  onAuditSelectorClick: () => void;
}

const NAV: Array<{ view: View; label: string; Icon: typeof Home }> = [
  { view: 'home', label: 'Accueil', Icon: Home },
  { view: 'audit', label: 'Audit', Icon: List },
  { view: 'summary', label: 'Synthèse', Icon: BarChart3 },
  { view: 'glossary', label: 'Glossaire', Icon: BookOpen },
];

const MODE_LABEL: Record<Mode, string> = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
};

function Sidebar({ view, onNavigate, activeAudit, counts, total, onAuditSelectorClick }: SidebarProps) {
  const evaluated = counts.conforme + counts.ecarts + counts.nonApplicable;
  const share = total > 0 ? evaluated / total : 0;
  const percentage = Math.round(share * 100);

  const legend = [
    { key: 'conforme' as const, count: counts.conforme },
    { key: 'non-conforme' as const, count: counts.ecarts },
    { key: 'non-applicable' as const, count: counts.nonApplicable },
    { key: UNSET_STATUS, count: counts.aEvaluer },
  ];

  return (
    <div className="flex w-[244px] flex-shrink-0 flex-col gap-6 px-3 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ctrl bg-ink text-surface">
          <AccessipoteLogo size={16} />
        </span>
        <span className="text-lead font-semibold">Accessipote</span>
      </div>

      {activeAudit && (
        <button
          type="button"
          onClick={onAuditSelectorClick}
          className="flex h-two w-full items-center gap-3 rounded-ctrl border-1 border-border bg-surface px-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold">{activeAudit.name}</span>
            <span className="mt-1 block font-mono text-meta text-ink-muted">
              {MODE_LABEL[activeAudit.mode]}
            </span>
          </span>
          <ChevronsUpDown size={16} aria-hidden="true" className="flex-shrink-0 text-ink-muted" />
        </button>
      )}

      <nav aria-label="Navigation principale">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ view: target, label, Icon }) => {
            const isActive = view === target;
            return (
              <li key={target}>
                <button
                  type="button"
                  onClick={() => onNavigate(target)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex w-full items-center gap-3 rounded-ctrl p-3 text-body',
                    isActive ? 'bg-ink font-semibold text-surface' : 'font-medium text-ink-muted',
                  ].join(' ')}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {activeAudit && (
        <div className="rounded-card bg-surface p-4">
          <h2 className="text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Cet audit
          </h2>

          <div className="mt-3 flex items-center gap-3">
            <AuditRing
              size={56}
              segments={[{ key: 'evalues', share, color: 'var(--a-ink)' }]}
              label={`${percentage} % des critères évalués`}
            >
              <span className="font-mono text-dense font-semibold">{percentage}%</span>
            </AuditRing>
            <div>
              <p className="text-lead font-semibold">
                {evaluated} / {total}
              </p>
              <p className="text-dense text-ink-muted">critères évalués</p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {legend.map(({ key, count }) => {
              const { label, Icon, color } = getStatusPresentation(
                key === UNSET_STATUS ? undefined : key,
                activeAudit.mode,
              );
              return (
                <li key={key} className="grid grid-cols-[16px_1fr_auto] items-center gap-2">
                  <Icon size={16} strokeWidth={2.6} aria-hidden="true" style={{ color }} />
                  <span className="text-dense">{label}</span>
                  <span className="font-mono text-meta font-semibold">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeAudit && (
        <p className="flex items-center gap-1 text-dense text-ink-muted">
          <Check size={12} strokeWidth={2.6} aria-hidden="true" />
          Enregistré {formatRelativeTime(activeAudit.updatedAt)}
        </p>
      )}
    </div>
  );
}

export default memo(Sidebar);
