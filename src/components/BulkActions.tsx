import { memo } from 'react';
import type { CriteriaStatus, Mode } from '../types';
import { getSelectableStatuses } from '../utils/statusPresentation';

interface BulkActionsProps {
  selectedCount: number;
  mode: Mode;
  onApply: (status: CriteriaStatus) => void;
  onClearStatus: () => void;
  onDeselectAll: () => void;
}

/**
 * N'apparaît qu'avec une sélection, et annonce son cardinal. L'ancien « tout
 * sélectionner » agissait sur la liste filtrée courante : l'utilisateur ne
 * voyait pas ce qu'il allait modifier.
 */
function BulkActions({
  selectedCount,
  mode,
  onApply,
  onClearStatus,
  onDeselectAll,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  const statuses = getSelectableStatuses(mode);

  return (
    <div
      role="region"
      aria-label="Actions groupées"
      className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-frame bg-ink p-6 text-surface shadow-panel"
    >
      <span className="font-mono text-body font-semibold">
        {selectedCount} critère{selectedCount > 1 ? 's' : ''} sélectionné
        {selectedCount > 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={onDeselectAll}
        className="text-body underline underline-offset-2"
      >
        Tout désélectionner
      </button>

      <span className="flex-1" />

      {statuses.map(({ key, label, Icon }, index) => (
        <button
          key={key}
          type="button"
          onClick={() => onApply(key as CriteriaStatus)}
          className={[
            'flex h-ctrl items-center gap-2 rounded-ctrl px-3 text-body font-semibold',
            index === 0 ? 'bg-surface text-ink' : 'border-1 border-[#5A5A5A]',
          ].join(' ')}
        >
          <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
          {label}
        </button>
      ))}

      <button
        type="button"
        onClick={onClearStatus}
        className="flex h-ctrl items-center rounded-ctrl border-1 border-[#5A5A5A] px-3 text-body font-semibold"
      >
        Effacer le statut
      </button>
    </div>
  );
}

export default memo(BulkActions);
