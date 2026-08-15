import { memo } from 'react';
import type { CriteriaStatus, Mode } from '../types';
import { getSelectableStatuses } from '../utils/statusPresentation';

export type StatusButtonsDensity = 'card' | 'detail';

interface StatusButtonsProps {
  criteriaId: string;
  criteriaTitle: string;
  mode: Mode;
  currentStatus: CriteriaStatus | undefined;
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  density?: StatusButtonsDensity;
}

// En dessous de `sm`, les trois boutons passent en colonne : trois cibles de
// 48px de large valent mieux qu'une rangée de trois cibles qu'on rate au pouce.
const GROUP_CLASS: Record<StatusButtonsDensity, string> = {
  card: 'flex flex-col gap-2 sm:flex-row sm:flex-wrap',
  detail: 'flex flex-col gap-2 sm:flex-row',
};

const BUTTON_CLASS: Record<StatusButtonsDensity, string> = {
  // 48px en tactile ; 40px de haut en desktop, mais la cible réelle y est portée
  // à 48px par le pseudo-élément.
  card: 'h-prim px-4 sm:h-ctrl',
  detail: 'h-prim px-4 sm:flex-1',
};

function StatusButtons({
  criteriaId,
  criteriaTitle,
  mode,
  currentStatus,
  onStatusChange,
  density = 'card',
}: StatusButtonsProps) {
  const statuses = getSelectableStatuses(mode);

  return (
    <div
      role="radiogroup"
      aria-label={`Statut du critère ${criteriaId} — ${criteriaTitle}`}
      className={GROUP_CLASS[density]}
    >
      {statuses.map(({ key, label, Icon, pillClass }) => {
        const isSelected = currentStatus === key;

        return (
          <label
            key={key}
            className={[
              'relative inline-flex cursor-pointer items-center justify-center gap-2',
              'rounded-ctrl border-1.5 text-body transition',
              // La cible tactile déborde de 4px en haut et en bas : 40px de
              // hauteur visuelle ne feraient pas les 44px exigés.
              "before:absolute before:inset-x-0 before:-top-1 before:-bottom-1 before:content-['']",
              BUTTON_CLASS[density],
              isSelected
                ? `${pillClass} border-current font-semibold`
                : 'border-border bg-surface text-ink-muted font-medium',
            ].join(' ')}
          >
            <input
              type="radio"
              name={`status-${criteriaId}`}
              value={key}
              checked={isSelected}
              className="sr-only"
              onChange={() => onStatusChange(criteriaId, key as CriteriaStatus)}
              // Un second clic sur le statut actif l'efface : `change` ne se
              // déclenche pas dans ce cas, seul `click` le voit.
              onClick={() => {
                if (isSelected) onStatusChange(criteriaId, '');
              }}
            />
            <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
            {label}
          </label>
        );
      })}
    </div>
  );
}

export default memo(StatusButtons);
