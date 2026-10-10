import { useMemo } from 'react';
import type { CriteriaRGAA, CriteriaFilters } from '../types';
import { UNSET_STATUS } from '../utils/statusPresentation';

/** Ce que le scan a laissé sur l'audit, critère par critère. Seule la présence compte. */
export interface ScanMarks {
  auto?: Record<string, unknown>;
  leads?: Record<string, unknown>;
}

const NO_MARKS: ScanMarks = {};

export const EMPTY_FILTERS: CriteriaFilters = { search: '', level: '', status: '', scan: '' };

/**
 * Filtrage des critères par recherche, niveau, statut et marques du scan.
 *
 * Le thème n'est plus une dimension de filtre : il est devenu la navigation
 * (`ThemeRail`), et le tri par thème se fait donc en amont, sur la liste passée
 * en entrée.
 */
export function useFilters(
  criteriaList: CriteriaRGAA[],
  filters: CriteriaFilters,
  currentProgress: { [criteriaId: string]: { status: string } },
  scanMarks: ScanMarks = NO_MARKS,
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
      const status = currentProgress[criteria.id]?.status;
      const statusMatch =
        filters.status === '' ||
        (filters.status === UNSET_STATUS ? status === undefined : status === filters.status);
      const scanMatch = !filters.scan || scanMarks[filters.scan]?.[criteria.id] !== undefined;

      return searchMatch && levelMatch && statusMatch && scanMatch;
    });
  }, [filters.search, filters.level, filters.status, filters.scan, currentProgress, scanMarks, criteriaList]);

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
