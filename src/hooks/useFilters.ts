import { useMemo } from 'react';
import type { CriteriaRGAA, CriteriaFilters } from '../types';

/**
 * Hook personnalisé pour gérer le filtrage des critères
 * Gère la logique de recherche, filtres par thème, niveau et statut
 * 
 * @param criteriaList - Liste complète des critères
 * @param filters - État actuel des filtres
 * @param currentProgress - Progrès actuel pour le mode sélectionné
 * @returns Fonctions et données filtrées
 */
export function useFilters(
  criteriaList: CriteriaRGAA[],
  filters: CriteriaFilters,
  currentProgress: { [criteriaId: string]: { status: string } }
) {
  // Filtrer les critères basés sur les filtres
  const filteredCriteria = useMemo(() => {
    return criteriaList.filter(criteria => {
      const searchMatch = filters.search === '' || 
        criteria.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        criteria.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (criteria.description && criteria.description.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Si aucun thème sélectionné, afficher tous les critères
      const themeMatch = filters.themes.length === 0 || filters.themes.includes(criteria.theme);
      const levelMatch = filters.level === '' || criteria.level === filters.level;
      
      const statusMatch = filters.status === '' || 
        currentProgress[criteria.id]?.status === filters.status;
      
      return searchMatch && themeMatch && levelMatch && statusMatch;
    });
  }, [filters, currentProgress, criteriaList]);

  // Calculer les thèmes et niveaux uniques avec memoization
  const uniqueThemes = useMemo(() => {
    return [...new Set(criteriaList.map(c => c.theme))];
  }, [criteriaList]);

  const uniqueLevels = useMemo(() => {
    return [...new Set(criteriaList.map(c => c.level))];
  }, [criteriaList]);

  // Calculer le total et les critères complétés basés sur les thèmes sélectionnés
  const totalCriteria = useMemo(() => {
    // Si aucun thème sélectionné, afficher tous les critères
    if (filters.themes.length === 0) {
      return criteriaList.length;
    }
    // Sinon, compter uniquement les critères des thèmes sélectionnés
    return criteriaList.filter(c => filters.themes.includes(c.theme)).length;
  }, [criteriaList, filters.themes]);

  const completedCriteria = useMemo(() => {
    if (filters.themes.length === 0) {
      return Object.keys(currentProgress).length;
    }
    // Compter uniquement les critères complétés des thèmes sélectionnés
    return Object.keys(currentProgress).filter(id => {
      const criterion = criteriaList.find(c => c.id === id);
      return criterion && filters.themes.includes(criterion.theme);
    }).length;
  }, [currentProgress, criteriaList, filters.themes]);

  const progressPercentage = totalCriteria > 0 ? (completedCriteria / totalCriteria) * 100 : 0;

  return {
    filteredCriteria,
    uniqueThemes,
    uniqueLevels,
    totalCriteria,
    completedCriteria,
    progressPercentage,
  };
}

