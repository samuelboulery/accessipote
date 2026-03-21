import { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: criteria.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 180,
    overscan: 3,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const handleCriteriaClick = useCallback((criteriaId: string) => {
    const index = criteria.findIndex((c) => c.id === criteriaId);
    if (index !== -1) {
      virtualizer.scrollToIndex(index, { behavior: 'smooth', align: 'center' });
    }
  }, [criteria, virtualizer]);

  if (criteria.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-12 text-center mb-6">
        <p className="text-gray-500 dark:text-gray-400">Aucun critère ne correspond aux filtres sélectionnés.</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Liste des critères ({criteria.length})
        </h2>
      </div>
      <div
        ref={scrollContainerRef}
        data-testid="criteria-scroll-container"
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-y-auto h-[calc(100vh-16rem)] min-h-[400px]"
      >
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
        >
          {virtualItems.map((virtualItem) => {
            const criterion = criteria[virtualItem.index];
            return (
              <div
                key={criterion.id}
                id={`criteria-${criterion.id}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <CriteriaItem
                  criterion={criterion}
                  mode={mode}
                  currentStatus={progress[criterion.id]?.status}
                  onStatusChange={onStatusChange}
                  onGlossaryClick={onGlossaryClick}
                  onCriteriaClick={handleCriteriaClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
