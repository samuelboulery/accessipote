import { useState } from 'react';
import { logError } from '../utils/logger';

/**
 * Valide que la donnée est un objet (pas null, pas array primitif)
 */
function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valide les données relues du localStorage.
 *
 * La valeur arrive de `JSON.parse` : elle ne peut contenir ni fonction, ni date,
 * ni cycle — inutile de la re-sérialiser pour s'en assurer. Ce qui reste à
 * vérifier, c'est sa forme : un tableau ou un nombre sous la clé d'un objet ne
 * vient pas de l'application, et doit retomber sur la valeur initiale plutôt que
 * de traverser l'écran.
 */
function validateStoredData<T>(value: unknown, initialValue: T): T {
  if (value === null || value === undefined) {
    return initialValue;
  }

  if (typeof initialValue === 'object') {
    if (!isValidObject(value)) {
      logError('Données localStorage invalides (pas un objet)');
      return initialValue;
    }
    return value as T;
  }

  if (typeof value !== typeof initialValue) {
    logError('Données localStorage invalides (type incorrect)');
    return initialValue;
  }

  return value as T;
}

function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      return validateStoredData(JSON.parse(item), initialValue);
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
