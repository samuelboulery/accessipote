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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
          Actions en masse ({displayedCriteriaCount} critères) :
        </span>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CriteriaStatus)}
            className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => onSelectAll(selectedStatus)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
            >
              <CheckSquare className="w-4 h-4" />
              Appliquer à tous
            </button>

            <button
              onClick={onDeselectAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
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

