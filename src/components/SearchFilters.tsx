import type React from 'react';
import type { CriteriaFilters } from '../types';
import ThemeSelector from './ThemeSelector';

interface SearchFiltersProps {
  filters: CriteriaFilters;
  onFiltersChange: (filters: CriteriaFilters) => void;
  themes: string[];
  mode: 'classic' | 'design-system';
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function SearchFilters({
  filters,
  onFiltersChange,
  themes,
  mode,
  inputRef,
}: SearchFiltersProps) {
  const handleFilterChange = (key: keyof CriteriaFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const statusOptions =
    mode === 'classic'
      ? ['conforme', 'non-conforme', 'non-applicable']
      : ['default-compliant', 'project-implementation', 'non-applicable'];

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filtres de recherche</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recherche textuelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recherche
          </label>
          <input
            ref={inputRef}
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="ID, titre, description..."
            maxLength={200}
            aria-keyshortcuts="Control+f Meta+f"
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sélection multiple de thèmes */}
      <div className="mt-4">
        <ThemeSelector
          availableThemes={themes}
          selectedThemes={filters.themes}
          onThemesChange={(themes) => onFiltersChange({ ...filters, themes })}
        />
      </div>


    </div>
  );
}
