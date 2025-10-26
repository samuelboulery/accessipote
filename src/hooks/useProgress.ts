import { useCallback } from 'react';
import type { Progress, CriteriaStatus, CriteriaRGAA } from '../types';

/**
 * Hook personnalisé pour gérer le progrès des critères
 * Gère les changements de statut, actions en masse et la logique de mode
 * 
 * @param progress - État actuel du progrès pour tous les modes
 * @param setProgress - Fonction pour mettre à jour le progrès
 * @param mode - Mode actuel ('classic' ou 'design-system')
 * @param filteredCriteria - Critères filtrés pour les actions en masse
 * @returns Handlers pour la gestion du progrès
 */
export function useProgress(
  progress: Progress,
  setProgress: (value: Progress | ((val: Progress) => Progress)) => void,
  mode: 'classic' | 'design-system',
  filteredCriteria: CriteriaRGAA[]
) {
  // Convertir le mode en clé pour le progrès
  const modeKey = mode === 'design-system' ? 'designSystem' : 'classic';

  // Mettre à jour le statut d'un critère
  const handleCriteriaStatusChange = useCallback((criteriaId: string, status: string) => {
    const newProgress = {
      ...progress,
      [modeKey]: {
        ...progress[modeKey],
      },
    };

    // Si le statut est vide, supprimer l'entrée plutôt que de l'enregistrer
    if (status === '' || !status) {
      delete newProgress[modeKey][criteriaId];
    } else {
      newProgress[modeKey][criteriaId] = { status: status as CriteriaStatus };
    }

    setProgress(newProgress);
  }, [progress, setProgress, modeKey]);

  // Appliquer un statut à tous les critères affichés
  const handleSelectAll = useCallback((status: CriteriaStatus) => {
    // Valider que le statut correspond au mode actuel
    if (modeKey === 'classic') {
      // S'assurer que le statut est un ClassicStatus
      if (!['conforme', 'non-conforme', 'non-applicable'].includes(status)) {
        return;
      }
    } else {
      // S'assurer que le statut est un DesignSystemStatus
      if (!['default-compliant', 'project-implementation'].includes(status)) {
        return;
      }
    }
    
    const newCriteria = { ...progress[modeKey] };
    filteredCriteria.forEach(criterion => {
      // Type narrowing garanti par les validations ci-dessus
      newCriteria[criterion.id] = { status: status as CriteriaStatus };
    });
    setProgress({ ...progress, [modeKey]: newCriteria });
  }, [progress, setProgress, modeKey, filteredCriteria]);

  // Effacer tous les statuts des critères affichés
  const handleDeselectAll = useCallback(() => {
    const newCriteria = { ...progress[modeKey] };
    filteredCriteria.forEach(criterion => {
      delete newCriteria[criterion.id];
    });
    setProgress({ ...progress, [modeKey]: newCriteria });
  }, [progress, setProgress, modeKey, filteredCriteria]);

  // Obtenir le progrès pour le mode actuel
  const currentProgress = progress[modeKey];

  return {
    handleCriteriaStatusChange,
    handleSelectAll,
    handleDeselectAll,
    currentProgress,
  };
}

