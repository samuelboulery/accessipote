import type { Mode } from '../types';
import type { SummaryStats, ThemeStats } from './calculateSummaryStats';
import { getStatusPresentation } from './statusPresentation';

export interface SummaryBucket {
  key: 'conforme' | 'ecarts' | 'nonApplicable' | 'aEvaluer';
  label: string;
  count: number;
  color: string;
  Icon: ReturnType<typeof getStatusPresentation>['Icon'];
}

export interface SummaryView {
  buckets: SummaryBucket[];
  /**
   * Le taux ne mesure pas la même chose selon le mode : une conformité en
   * classique, une prise en charge par le design system sinon. Les nommer
   * pareil ferait dire à un audit design system quelque chose de faux sur le
   * site audité — le design system peut couvrir la moitié des critères sans
   * qu'aucune page ne soit conforme.
   */
  rateLabel: string;
  /** Pourquoi les non applicables sortent du dénominateur, dans les termes du mode. */
  rateNote: string;
  /** conforme + écarts + non applicable — sert l'avancement. */
  evaluated: number;
  /** conforme + écarts — sert le taux de conformité. Dénominateur différent. */
  settled: number;
  total: number;
  rate: number | null;
}

/**
 * Une seule source pour tous les compteurs d'un écran.
 *
 * Le bug le plus coûteux de la synthèse est la divergence : un anneau à 39 %,
 * un libellé « 41 / 106 » et une légende totalisant 48. `calculateSummaryStats`
 * distingue déjà correctement les deux dénominateurs, c'est l'affichage qui les
 * confondait — d'où cette vue unique dont tout se dérive.
 */
export function toSummaryView(stats: SummaryStats, mode: Mode): SummaryView {
  const conforme = stats.conforme + stats.defaultCompliant;
  const ecarts = stats.nonConforme + stats.projectImplementation;

  const okKey = mode === 'classic' ? 'conforme' : 'default-compliant';
  const koKey = mode === 'classic' ? 'non-conforme' : 'project-implementation';

  const isClassic = mode === 'classic';

  const ok = getStatusPresentation(okKey, mode);
  const ko = getStatusPresentation(koKey, mode);
  const na = getStatusPresentation('non-applicable', mode);
  const todo = getStatusPresentation(undefined, mode);

  return {
    buckets: [
      { key: 'conforme', label: ok.label, count: conforme, color: ok.color, Icon: ok.Icon },
      { key: 'ecarts', label: ko.label, count: ecarts, color: ko.color, Icon: ko.Icon },
      {
        key: 'nonApplicable',
        label: na.label,
        count: stats.nonApplicable,
        color: na.color,
        Icon: na.Icon,
      },
      {
        key: 'aEvaluer',
        label: todo.label,
        count: stats.notEvaluated,
        color: todo.color,
        Icon: todo.Icon,
      },
    ],
    rateLabel: isClassic
      ? 'Taux de conformité'
      : 'Taux de prise en charge par le design system',
    rateNote: isClassic
      ? 'Les critères non applicables sont exclus du calcul : ils ne peuvent être ni conformes ni non conformes.'
      : 'Les critères non applicables sont exclus du calcul : ils ne sont à la charge ni du design system ni du projet.',
    evaluated: conforme + ecarts + stats.nonApplicable,
    settled: conforme + ecarts,
    total: stats.total,
    rate: stats.globalRate,
  };
}

export function themeCounts(theme: ThemeStats) {
  const conforme = theme.conforme + theme.defaultCompliant;
  const ecarts = theme.nonConforme + theme.projectImplementation;
  return {
    conforme,
    ecarts,
    nonApplicable: theme.nonApplicable,
    aEvaluer: theme.total - conforme - ecarts - theme.nonApplicable,
    total: theme.total,
  };
}
