import { Check, X, Minus, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CriteriaStatus, Mode } from '../types';

/**
 * « À évaluer » n'est pas un statut stocké : c'est l'absence de statut. On lui
 * donne une clé pour pouvoir le rendre comme les autres.
 */
export const UNSET_STATUS = 'a-evaluer' as const;

export type StatusKey = CriteriaStatus | typeof UNSET_STATUS;

export interface StatusPresentation {
  key: StatusKey;
  label: string;
  Icon: LucideIcon;
  /** Fond et texte de la pastille. */
  pillClass: string;
  /** Fond et bordure de la carte de critère. */
  cardClass: string;
  /** Trait de jauge et d'anneau. */
  color: string;
}

/**
 * Règle absolue : jamais la couleur seule. Chaque statut porte une icône de
 * forme distincte et un libellé — trois pastilles qui ne diffèrent que par leur
 * teinte sont un échec RGAA, même à 7:1 de contraste.
 */
const CONFORME: Omit<StatusPresentation, 'key' | 'label'> = {
  Icon: Check,
  pillClass: 'bg-ok-bg text-ok-fg',
  cardClass: 'bg-ok-card border-ok-line',
  color: 'var(--a-ok)',
};

const ECART: Omit<StatusPresentation, 'key' | 'label'> = {
  Icon: X,
  pillClass: 'bg-ko-bg text-ko-fg',
  cardClass: 'bg-ko-card border-ko-line',
  color: 'var(--a-ko)',
};

const NON_APPLICABLE: Omit<StatusPresentation, 'key' | 'label'> = {
  Icon: Minus,
  pillClass: 'bg-na-bg text-na-fg',
  cardClass: 'bg-surface border-border',
  color: 'var(--a-na-bar)',
};

const A_EVALUER: Omit<StatusPresentation, 'key' | 'label'> = {
  Icon: Clock,
  pillClass: 'bg-todo-bg text-todo-fg',
  cardClass: 'bg-surface border-border',
  color: 'var(--a-track)',
};

const CLASSIC: Record<StatusKey, StatusPresentation> = {
  'conforme': { key: 'conforme', label: 'Conforme', ...CONFORME },
  'non-conforme': { key: 'non-conforme', label: 'Non conforme', ...ECART },
  'non-applicable': { key: 'non-applicable', label: 'Non applicable', ...NON_APPLICABLE },
  'default-compliant': { key: 'default-compliant', label: 'Conforme', ...CONFORME },
  'project-implementation': { key: 'project-implementation', label: 'Non conforme', ...ECART },
  [UNSET_STATUS]: { key: UNSET_STATUS, label: 'À évaluer', ...A_EVALUER },
};

/**
 * En design system les libellés changent, mais les icônes et les rôles de
 * couleur restent : c'est le même axe sémantique.
 */
const DESIGN_SYSTEM: Record<StatusKey, StatusPresentation> = {
  ...CLASSIC,
  'default-compliant': { key: 'default-compliant', label: 'Conforme par défaut', ...CONFORME },
  'project-implementation': { key: 'project-implementation', label: 'À mettre en place', ...ECART },
};

export function getStatusPresentation(status: CriteriaStatus | undefined, mode: Mode): StatusPresentation {
  const table = mode === 'classic' ? CLASSIC : DESIGN_SYSTEM;
  return table[status ?? UNSET_STATUS];
}

/**
 * Les trois statuts sélectionnables d'un mode, dans l'ordre d'affichage. Le type
 * de retour restreint `key` à un vrai statut — « à évaluer » n'en est pas un —
 * ce qui évite un cast chez chaque appelant.
 */
export function getSelectableStatuses(
  mode: Mode,
): Array<StatusPresentation & { key: CriteriaStatus }> {
  const keys: CriteriaStatus[] = mode === 'classic'
    ? ['conforme', 'non-conforme', 'non-applicable']
    : ['default-compliant', 'project-implementation', 'non-applicable'];
  return keys.map(key => ({ ...getStatusPresentation(key, mode), key }));
}
