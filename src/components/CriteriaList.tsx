import { useCallback } from 'react';
import type { CriteriaRGAA, Mode } from '../types';
import CriteriaItem from './CriteriaItem';

interface CriteriaListProps {
  criteria: CriteriaRGAA[];
  mode: Mode;
  progress: {
    [criteriaId: string]: {
      status: 'conforme' | 'non-conforme' | 'non-applicable' | 'default-compliant' | 'project-implementation';
    }
  };
  onStatusChange: (criteriaId: string, status: string) => void;
  onGlossaryClick: (slug: string) => void;
}

export default function CriteriaList({
  criteria,
  mode,
  progress,
  onStatusChange,
  onGlossaryClick,
}: CriteriaListProps) {
  const handleCriteriaClick = useCallback((criteriaId: string) => {
    const element = document.getElementById(`criteria-${criteriaId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  if (criteria.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center mb-6">
        <p className="text-gray-500">Aucun critère ne correspond aux filtres sélectionnés.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Liste des critères ({criteria.length})
        </h2>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {criteria.map((criterion) => (
          <div key={criterion.id} id={`criteria-${criterion.id}`}>
            <CriteriaItem
              criterion={criterion}
              mode={mode}
              currentStatus={progress[criterion.id]?.status}
              onStatusChange={onStatusChange}
              onGlossaryClick={onGlossaryClick}
              onCriteriaClick={handleCriteriaClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
