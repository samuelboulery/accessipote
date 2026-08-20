import { memo, useEffect, useState } from 'react';
import { Home, List, BarChart3, BookOpen, Check, Settings } from 'lucide-react';
import type { Audit } from '../types';
import type { ThemeMode } from '../hooks/useDarkMode';
import AccessipoteLogo from './AccessipoteLogo';
import AuditRing from './AuditRing';
import AuditSwitcher, { type SwitchableAudit } from './AuditSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { getSelectableStatuses, getStatusPresentation, UNSET_STATUS } from '../utils/statusPresentation';
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
  audits: SwitchableAudit[];
  onSelectAudit: (auditId: string) => void;
  onCreateAudit: () => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  onOpenExportSettings: () => void;
}

const NAV: Array<{ view: View; label: string; Icon: typeof Home }> = [
  { view: 'home', label: 'Accueil', Icon: Home },
  { view: 'audit', label: 'Audit', Icon: List },
  { view: 'summary', label: 'Synthèse', Icon: BarChart3 },
  { view: 'glossary', label: 'Glossaire', Icon: BookOpen },
];

function Sidebar({
  view,
  onNavigate,
  activeAudit,
  counts,
  total,
  audits,
  onSelectAudit,
  onCreateAudit,
  themeMode,
  onCycleTheme,
  onOpenExportSettings,
}: SidebarProps) {
  // « il y a 2 minutes » se figerait sans ce battement : rien ne provoque de
  // rendu entre deux modifications.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const evaluated = counts.conforme + counts.ecarts + counts.nonApplicable;
  const share = total > 0 ? evaluated / total : 0;
  const percentage = Math.round(share * 100);

  // Les clés dépendent du mode : « conforme » n'existe pas en design system, où
  // le même seau s'appelle « conforme par défaut ». Les écrire en dur ici
  // annulait le mode passé plus bas à getStatusPresentation.
  const [ok, ko, na] = activeAudit ? getSelectableStatuses(activeAudit.mode) : [];
  const legend = activeAudit
    ? [
        { key: ok.key, count: counts.conforme },
        { key: ko.key, count: counts.ecarts },
        { key: na.key, count: counts.nonApplicable },
        { key: UNSET_STATUS, count: counts.aEvaluer },
      ]
    : [];

  return (
    <div className="flex w-[244px] flex-shrink-0 flex-col gap-6 px-3 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ctrl bg-ink text-surface">
          <AccessipoteLogo size={16} />
        </span>
        <span className="text-lead font-semibold">Accessipote</span>
      </div>

      {activeAudit && (
        <AuditSwitcher
          activeAudit={activeAudit}
          audits={audits}
          onSelectAudit={onSelectAudit}
          onSeeAllAudits={() => onNavigate('home')}
          onCreateAudit={onCreateAudit}
        />
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

      {/* Pied de colonne : la bascule doit être atteignable des quatre écrans,
          pas seulement de l'audit. */}
      <div className="mt-auto flex items-center gap-2">
        {activeAudit && (
          // `truncate` plutôt qu'un retour à la ligne : sur deux lignes, la
          // coche se retrouvait centrée entre les deux au lieu de la première.
          <p className="flex min-w-0 flex-1 items-center gap-1 truncate text-dense text-ink-muted">
            <Check size={12} strokeWidth={2.6} aria-hidden="true" className="flex-shrink-0" />
            <span className="truncate">
              Enregistré {formatRelativeTime(activeAudit.updatedAt, new Date(), 'short')}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={onOpenExportSettings}
          aria-label="Personnaliser l’export Markdown"
          title="Personnaliser l’export Markdown"
          className="target-44 flex h-ctrl w-ctrl flex-shrink-0 items-center justify-center rounded-ctrl border-1 border-border bg-surface"
        >
          <Settings size={16} aria-hidden="true" />
        </button>
        <DarkModeToggle mode={themeMode} onCycle={onCycleTheme} />
      </div>
    </div>
  );
}

export default memo(Sidebar);
