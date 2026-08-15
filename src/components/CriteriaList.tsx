import type { CriteriaRGAA, Mode, CriteriaStatus } from '../types';
import CriteriaItem from './CriteriaItem';
import EmptyState from './EmptyState';

interface CriteriaListProps {
  criteria: CriteriaRGAA[];
  mode: Mode;
  progress: { [criteriaId: string]: { status: CriteriaStatus } };
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  onGlossaryClick: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
  onExpand: (criteriaId: string) => void;
  selection: Set<string>;
  onSelectedChange: (criteriaId: string, selected: boolean) => void;
  emptyState?: React.ReactNode;
}

/**
 * Plus de virtualiseur : avec le parcours par thème le plus gros lot fait 14
 * critères, et le virtualiseur cassait Ctrl+F, le focus au défilement et le lien
 * profond depuis le glossaire.
 */
export default function CriteriaList({
  criteria,
  mode,
  progress,
  onStatusChange,
  onGlossaryClick,
  onCriteriaClick,
  onExpand,
  selection,
  onSelectedChange,
  emptyState,
}: CriteriaListProps) {
  if (criteria.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            title="Aucun critère à afficher"
            body="Aucun critère ne correspond aux filtres actifs pour ce thème."
          />
        )}
      </>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {criteria.map(criterion => (
        <li key={criterion.id}>
          <CriteriaItem
            criterion={criterion}
            mode={mode}
            currentStatus={progress[criterion.id]?.status}
            onStatusChange={onStatusChange}
            onGlossaryClick={onGlossaryClick}
            onCriteriaClick={onCriteriaClick}
            onExpand={onExpand}
            isSelected={selection.has(criterion.id)}
            onSelectedChange={onSelectedChange}
          />
        </li>
      ))}
    </ul>
  );
}
