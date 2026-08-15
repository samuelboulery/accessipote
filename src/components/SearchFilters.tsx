import { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { CriteriaFilters, Mode } from '../types';
import { getSelectableStatuses } from '../utils/statusPresentation';
import { MAX_SEARCH_LENGTH } from '../constants';

interface SearchFiltersProps {
  filters: CriteriaFilters;
  onFiltersChange: (filters: CriteriaFilters) => void;
  levels: string[];
  mode: Mode;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Niveau et statut sont des affinages, pas la navigation principale : ils
 * passent derrière un bouton plutôt que d'occuper la barre en permanence.
 */
export default function SearchFilters({
  filters,
  onFiltersChange,
  levels,
  mode,
  inputRef,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const update = (patch: Partial<CriteriaFilters>) => onFiltersChange({ ...filters, ...patch });
  const activeCount = (filters.level === '' ? 0 : 1) + (filters.status === '' ? 0 : 1);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          ref={inputRef}
          type="search"
          value={filters.search}
          onChange={event => update({ search: event.target.value })}
          maxLength={MAX_SEARCH_LENGTH}
          aria-label="Rechercher un critère"
          aria-keyshortcuts="Control+K Meta+K"
          placeholder="Rechercher un critère"
          className="h-ctrl w-full rounded-card border-1 border-border bg-surface pl-8 pr-14 text-body"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta text-ink-muted"
        >
          ⌘K
        </span>
      </div>

      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsOpen(open => !open)}
          aria-expanded={isOpen}
          className="flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtrer
          {activeCount > 0 && (
            <span className="rounded-pill bg-ink px-2 font-mono text-meta text-surface">
              {activeCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 z-10 mt-2 flex w-[280px] flex-col gap-4 rounded-card border-1 border-border bg-surface p-4 shadow-panel">
            <div>
              <label htmlFor="filter-level" className="mb-2 block text-body font-semibold">
                Niveau
              </label>
              <select
                id="filter-level"
                value={filters.level}
                onChange={event => update({ level: event.target.value })}
                className="h-ctrl w-full rounded-ctrl border-1 border-border bg-surface px-2 text-body"
              >
                <option value="">Tous les niveaux</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-status" className="mb-2 block text-body font-semibold">
                Statut
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={event => update({ status: event.target.value })}
                className="h-ctrl w-full rounded-ctrl border-1 border-border bg-surface px-2 text-body"
              >
                <option value="">Tous les statuts</option>
                {getSelectableStatuses(mode).map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => update({ level: '', status: '' })}
                className="h-ctrl rounded-ctrl border-1 border-border text-body"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
