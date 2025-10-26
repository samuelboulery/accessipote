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
        ];

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Actions en masse ({displayedCriteriaCount} critères) :
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CriteriaStatus)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSelectAll(selectedStatus)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
          >
            <CheckSquare className="w-4 h-4" />
            Appliquer à tous
          </button>

          <button
            onClick={onDeselectAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-all shadow-sm hover:shadow font-semibold"
          >
            <XSquare className="w-4 h-4" />
            Tout effacer
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(BulkActions);

