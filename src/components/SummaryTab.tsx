import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { CriteriaRGAA, Mode, Progress } from '../types';
import { calculateSummaryStats } from '../utils/calculateSummaryStats';
import { toSummaryView } from '../utils/summaryView';
import AuditRing from './AuditRing';
import EmptyState from './EmptyState';
import SegmentedGauge from './SegmentedGauge';
import ThemeSummaryTable from './ThemeSummaryTable';

interface SummaryTabProps {
  criteriaList: CriteriaRGAA[];
  progress: Progress;
  mode: Mode;
  actions?: React.ReactNode;
}

function formatRate(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate)} %`;
}

export default function SummaryTab({ criteriaList, progress, mode, actions }: SummaryTabProps) {
  const stats = useMemo(
    () =>
      calculateSummaryStats(
        criteriaList,
        mode === 'classic' ? progress.classic : progress.designSystem,
        mode,
      ),
    [criteriaList, progress, mode],
  );

  // Tout ce qui suit se dérive de cette seule vue : libellés, ratios, arcs,
  // parts des indicateurs et badges de thème ne peuvent donc pas diverger.
  const view = useMemo(() => toSummaryView(stats, mode), [stats, mode]);

  const share = view.total > 0 ? view.evaluated / view.total : 0;
  const distribution = view.buckets
    .map(bucket => `${bucket.count} ${bucket.label.toLowerCase()}`)
    .join(', ');

  // Rien d'évalué : les compteurs n'auraient que des zéros à montrer, le taux un
  // tiret, et l'export produirait un document vide. Le titre reste — c'est bien
  // la synthèse qu'on regarde, elle n'a simplement rien à dire encore.
  if (view.evaluated === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-section font-semibold">Synthèse</h1>
        <EmptyState
          title="Aucun critère évalué"
          body="Les chiffres arrivent dès le premier statut posé. Ouvre l'onglet Audit et commence par le thème que tu veux."
          Icon={BarChart3}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-section font-semibold">Synthèse</h1>
          <p className="text-body text-ink-muted">
            {view.evaluated} critère{view.evaluated > 1 ? 's' : ''} évalué
            {view.evaluated > 1 ? 's' : ''} sur {view.total}
          </p>
        </div>
        {actions}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 wide:grid-cols-4">
        {view.buckets.map(({ key, label, count, color, Icon }) => (
          <li key={key} className="rounded-card border-1 border-border bg-surface p-4">
            <span className="flex items-center gap-2 text-body font-semibold">
              <Icon size={16} strokeWidth={2.6} aria-hidden="true" style={{ color }} />
              {label}
            </span>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-screen font-semibold">{count}</span>
              <span className="font-mono text-dense text-ink-muted">
                {view.total > 0 ? Math.round((count / view.total) * 100) : 0} %
              </span>
            </p>
            <SegmentedGauge
              className="mt-2"
              total={view.total}
              segments={[{ key, count, color }]}
              label={`${count} sur ${view.total}`}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-6">
        <div className="flex w-[400px] max-w-full flex-col gap-4 rounded-card border-1 border-border bg-surface p-4">
          <h2 className="text-lead font-semibold">Taux de conformité</h2>

          <div className="flex items-center gap-4">
            <AuditRing
              size={128}
              gap={4}
              label={`Répartition des ${view.total} critères : ${distribution}`}
              segments={view.buckets.map(bucket => ({
                key: bucket.key,
                share: view.total > 0 ? bucket.count / view.total : 0,
                color: bucket.color,
              }))}
            >
              <span className="font-mono text-screen font-semibold">{formatRate(view.rate)}</span>
            </AuditRing>

            <div className="min-w-0 flex-1">
              <p className="text-body">
                {view.buckets[0].count} {view.buckets[0].label.toLowerCase()} sur {view.settled}{' '}
                critère{view.settled > 1 ? 's' : ''} tranché{view.settled > 1 ? 's' : ''}.
              </p>
              <p className="mt-2 text-dense text-ink-muted">
                Les critères non applicables sont exclus du calcul : ils ne peuvent être ni
                conformes ni non conformes.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {view.buckets.map(({ key, label, count, color, Icon }) => (
              <li key={key} className="grid grid-cols-[18px_1fr_44px_52px] items-center gap-2">
                <Icon size={16} strokeWidth={2.6} aria-hidden="true" style={{ color }} />
                <span className="text-dense">{label}</span>
                <span className="text-right font-mono text-meta font-semibold">{count}</span>
                <span className="text-right font-mono text-meta text-ink-muted">
                  {view.total > 0 ? Math.round((count / view.total) * 100) : 0} %
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="mb-2 text-lead font-semibold">Avancement</h2>
          <p className="font-mono text-body font-semibold">
            {view.evaluated} / {view.total} évalués
          </p>
          <SegmentedGauge
            className="mt-2"
            total={view.total}
            segments={view.buckets.map(bucket => ({
              key: bucket.key,
              count: bucket.count,
              color: bucket.color,
            }))}
            label={distribution}
          />
          <p className="mt-2 text-dense text-ink-muted">
            {Math.round(share * 100)} % des critères de cet audit ont reçu un statut.
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lead font-semibold">Détail par thème</h2>
        <ThemeSummaryTable byTheme={stats.byTheme} mode={mode} stats={stats} />
      </div>
    </div>
  );
}
