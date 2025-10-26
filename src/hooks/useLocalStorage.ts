import { useState } from 'react';
import { logError } from '../utils/logger';

/**
 * Valide que la donnée est un objet (pas null, pas array primitif)
 */
function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valide les données du localStorage pour éviter les injections
 */
function validateStoredData<T>(value: unknown, initialValue: T): T {
  // Si la valeur est null/undefined, retourner la valeur initiale
  if (value === null || value === undefined) {
    return initialValue;
  }

  // Si c'est l'objet initial lui-même (référence), retourner tel quel
  if (value === initialValue) {
    return initialValue;
  }

  // Valider la structure pour les types d'objet
  if (typeof initialValue === 'object') {
    if (!isValidObject(value)) {
      logError('Données localStorage invalides (pas un objet)');
      return initialValue;
    }

    // Valider que c'est un objet "à plat" (pas de fonctions, dates, etc.)
    try {
      // JSON.stringify puis parse pour s'assurer qu'il n'y a pas de fonctions
      const cleaned = JSON.parse(JSON.stringify(value));
      return cleaned as T;
    } catch {
      logError('Données localStorage invalides (erreur de sérialisation)');
      return initialValue;
    }
  }

  // Pour les types primitifs, vérifier le type
  if (typeof value !== typeof initialValue) {
    logError('Données localStorage invalides (type incorrect)');
    return initialValue;
  }

  return value as T;
}

function useLocalStorage<T>(key: string, initialValue: T, migrationFn?: (oldValue: any) => T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        
        // Si une fonction de migration est fournie, l'utiliser
        let migratedValue = parsed;
        if (migrationFn) {
          try {
            migratedValue = migrationFn(parsed);
          } catch (migrationError) {
            logError('Erreur lors de la migration:', migrationError);
            return initialValue;
          }
        }
        
        // Valider les données avant de les utiliser
        return validateStoredData(migratedValue, initialValue);
      }
      return initialValue;
    } catch (error) {
      logError('Erreur lors de la récupération de localStorage:', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logError('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
