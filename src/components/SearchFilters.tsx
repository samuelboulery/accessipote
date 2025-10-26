import type { CriteriaFilters } from '../types';
import ThemeSelector from './ThemeSelector';

interface SearchFiltersProps {
  filters: CriteriaFilters;
  onFiltersChange: (filters: CriteriaFilters) => void;
  themes: string[];
  mode: 'classic' | 'design-system';
}

export default function SearchFilters({
  filters,
  onFiltersChange,
  themes,
  mode,
}: SearchFiltersProps) {
  const handleFilterChange = (key: keyof CriteriaFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const statusOptions =
    mode === 'classic'
      ? ['conforme', 'non-conforme', 'non-applicable']
      : ['default-compliant', 'project-implementation'];

  return (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres de recherche</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recherche textuelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="ID, titre, description..."
            maxLength={200}
            className="w-full px-3 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
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
