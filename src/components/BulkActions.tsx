import { CheckSquare, XSquare } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import type { Mode, CriteriaStatus } from '../types';

interface BulkActionsProps {
  mode: Mode;
  displayedCriteriaCount: number;
  onSelectAll: (status: CriteriaStatus) => void;
  onDeselectAll: () => void;
}

function BulkActions({
  mode,
  displayedCriteriaCount,
  onSelectAll,
  onDeselectAll,
}: BulkActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<CriteriaStatus>(
    mode === 'classic' ? 'conforme' : 'default-compliant'
  );

  // Réinitialiser le statut sélectionné quand le mode change
  useEffect(() => {
    setSelectedStatus(mode === 'classic' ? 'conforme' : 'default-compliant');
  }, [mode]);

  const statusOptions =
    mode === 'classic'
      ? [
          { value: 'conforme', label: 'Conforme' },
          { value: 'non-conforme', label: 'Non conforme' },
          { value: 'non-applicable', label: 'Non applicable' },
        ]
      : [
          { value: 'default-compliant', label: 'Conforme par défaut' },
          { value: 'project-implementation', label: 'À mettre en place' },
          { value: 'non-applicable', label: 'Non applicable' },
        ];

  return (
    <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
          Actions en masse ({displayedCriteriaCount} critères) :
        </span>

        <div className="flex flex-col lg:flex-row gap-2 lg:items-center flex-1">
          <fieldset className="flex flex-wrap gap-x-4 gap-y-1.5">
            <legend className="sr-only">Choisir un statut</legend>
            {statusOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bulk-status"
                  value={opt.value}
                  checked={selectedStatus === opt.value}
                  onChange={() => setSelectedStatus(opt.value as CriteriaStatus)}
                  className="w-4 h-4 accent-black dark:accent-white cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="flex gap-2">
            <button
              onClick={() => onSelectAll(selectedStatus)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
            >
              <CheckSquare className="w-4 h-4" />
              Appliquer à tous
            </button>

            <button
              onClick={onDeselectAll}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
            >
              <XSquare className="w-4 h-4" />
              Tout effacer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BulkActions);

