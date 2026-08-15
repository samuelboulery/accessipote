import { useMemo } from 'react';
import type { CriteriaRGAA, CriteriaFilters } from '../types';

/**
 * Filtrage des critères par recherche, niveau et statut.
 *
 * Le thème n'est plus une dimension de filtre : il est devenu la navigation
 * (`ThemeRail`), et le tri par thème se fait donc en amont, sur la liste passée
 * en entrée.
 */
export function useFilters(
  criteriaList: CriteriaRGAA[],
  filters: CriteriaFilters,
  currentProgress: { [criteriaId: string]: { status: string } },
) {
  const filteredCriteria = useMemo(() => {
    const search = filters.search.toLowerCase();

    return criteriaList.filter(criteria => {
      const searchMatch =
        search === '' ||
        criteria.id.toLowerCase().includes(search) ||
        criteria.title.toLowerCase().includes(search) ||
        (criteria.description?.toLowerCase().includes(search) ?? false);

      const levelMatch = filters.level === '' || criteria.level === filters.level;
      const statusMatch =
        filters.status === '' || currentProgress[criteria.id]?.status === filters.status;

      return searchMatch && levelMatch && statusMatch;
    });
  }, [filters.search, filters.level, filters.status, currentProgress, criteriaList]);

  const uniqueThemes = useMemo(
    () => [...new Set(criteriaList.map(c => c.theme))],
    [criteriaList],
  );

  const uniqueLevels = useMemo(
    () => [...new Set(criteriaList.map(c => c.level))],
    [criteriaList],
  );

  return { filteredCriteria, uniqueThemes, uniqueLevels };
}
