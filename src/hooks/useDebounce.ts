import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur
 * Utile pour éviter de déclencher trop souvent des actions coûteuses
 * (comme les recherches dans une grande liste)
 * 
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (défaut: 300ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Définir un timer pour mettre à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant que le délai soit écoulé
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
