import { memo } from 'react';
import type { Mode } from '../types';
import type { ThemeStats } from '../utils/calculateSummaryStats';
import { toSummaryView, themeCounts } from '../utils/summaryView';
import type { SummaryStats } from '../utils/calculateSummaryStats';
import SegmentedGauge from './SegmentedGauge';

interface ThemeSummaryTableProps {
  byTheme: ThemeStats[];
  mode: Mode;
  /** Sert uniquement à retrouver libellés, icônes et couleurs des colonnes. */
  stats: SummaryStats;
}

/**
 * Quatre colonnes chiffrées, chacune avec son icône en en-tête : les barres ne
 * font qu'illustrer ces nombres. Un lecteur d'écran, un daltonien et une
 * impression en niveaux de gris doivent obtenir la même information.
 */
function ThemeSummaryTable({ byTheme, mode, stats }: ThemeSummaryTableProps) {
  const { buckets } = toSummaryView(stats, mode);

  return (
    // Sept colonnes ne tiennent pas sur un téléphone, et les empiler en cartes
    // ferait perdre la comparaison d'un thème à l'autre — c'est tout l'objet du
    // tableau. Il défile donc, mais la zone doit être atteignable au clavier
    // (WCAG 2.1.1) : sans `tabindex`, les colonnes hors cadre sont perdues pour
    // qui n'a pas de souris.
    <div
      role="region"
      aria-label="Répartition par thème, tableau défilant horizontalement"
      tabIndex={0}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse text-body">
        <caption className="sr-only">Répartition des critères par thème</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className="p-2 text-left font-semibold">
              Thème
            </th>
            {buckets.map(({ key, label, Icon, color }) => (
              <th key={key} scope="col" className="p-2 text-right font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Icon size={16} strokeWidth={2.6} aria-hidden="true" style={{ color }} />
                  {label}
                </span>
              </th>
            ))}
            <th scope="col" className="min-w-[150px] p-2 text-left font-semibold">
              Répartition
            </th>
            <th scope="col" className="p-2 text-right font-semibold">
              Taux
            </th>
          </tr>
        </thead>
        <tbody>
          {byTheme.map(theme => {
            const counts = themeCounts(theme);
            const values = [counts.conforme, counts.ecarts, counts.nonApplicable, counts.aEvaluer];

            return (
              <tr key={theme.theme} className="border-b border-separator">
                <th scope="row" className="p-2 text-left font-medium">
                  {theme.theme}
                </th>
                {values.map((value, index) => (
                  <td key={buckets[index].key} className="p-2 text-right font-mono">
                    {value}
                  </td>
                ))}
                <td className="p-2">
                  <SegmentedGauge
                    className="min-w-[150px]"
                    total={counts.total}
                    segments={buckets.map((bucket, index) => ({
                      key: bucket.key,
                      count: values[index],
                      color: bucket.color,
                    }))}
                    label={buckets
                      .map((bucket, index) => `${values[index]} ${bucket.label.toLowerCase()}`)
                      .join(', ')}
                  />
                </td>
                <td className="p-2 text-right font-mono">
                  {theme.rate === null ? '–' : `${Math.round(theme.rate * 10) / 10} %`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ThemeSummaryTable);
