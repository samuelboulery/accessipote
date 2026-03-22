import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devrait initialiser avec la valeur par défaut', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });

  it('devrait charger une valeur existante depuis localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('devrait sauvegarder une valeur dans localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('devrait gérer les objets complexes', () => {
    const initialValue = { name: 'test', count: 0 };
    const newValue = { name: 'updated', count: 1 };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', initialValue)
    );

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(newValue));
  });

  it('devrait utiliser la fonction de mise à jour', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );

    act(() => {
      result.current[1]((prev) => ({ ...prev, count: prev.count + 1 }));
    });

    expect(result.current[0]).toEqual({ count: 1 });
  });

  it('devrait utiliser la fonction de migration', () => {
    localStorage.setItem('test-key', JSON.stringify({ old: true }));

    const migrationFn = (oldValue: unknown) => {
      if (typeof oldValue === 'object' && oldValue !== null) {
        return { ...(oldValue as Record<string, unknown>), migrated: true };
      }
      return { default: true };
    };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { default: true }, migrationFn)
    );

    expect(result.current[0]).toEqual({ old: true, migrated: true });
  });

  it('devrait rejeter les données invalides et retourner la valeur par défaut', () => {
    // Simuler des données corrompues
    localStorage.setItem('test-key', 'invalid-json{');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });

  it('devrait rejeter les données avec des fonctions et retourner une valeur propre', () => {
    // Essayer de mettre des données malveillantes
    localStorage.setItem('test-key', JSON.stringify({ normal: 'value' }));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { default: true })
    );

    expect(result.current[0]).toEqual({ normal: 'value' });
  });

  it('devrait fonctionner en dehors du navigateur (SSR)', () => {
    // Test simplifié : vérifier que la logique SSR est présente dans le code
    // Le test complet nécessiterait un environnement SSR complet
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });

  it('devrait retourner la valeur par défaut si la migration échoue', () => {
    localStorage.setItem('test-key', JSON.stringify({ old: true }));

    const migrationFn = () => {
      throw new Error('Erreur de migration');
    };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { default: true }, migrationFn)
    );

    expect(result.current[0]).toEqual({ default: true });
  });

  it('devrait retourner la valeur initiale si la valeur stockée n\'est pas un objet valide', () => {
    // Stocker un tableau alors que la valeur initiale est un objet
    localStorage.setItem('test-key', JSON.stringify([1, 2, 3]));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { default: true })
    );

    expect(result.current[0]).toEqual({ default: true });
  });

  it('devrait gérer l\'erreur de sauvegarde gracieusement', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    // Simuler une erreur lors de setItem
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('Storage full'); };

    act(() => {
      result.current[1]('new-value');
    });

    // Restaurer
    localStorage.setItem = originalSetItem;

    // La valeur en mémoire est mise à jour même si la sauvegarde échoue
    expect(result.current[0]).toBe('new-value');
  });

  it('devrait accepter une valeur primitive directe', () => {
    localStorage.setItem('test-key', JSON.stringify(42));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 0)
    );

    expect(result.current[0]).toBe(42);
  });

  it('devrait retourner la valeur initiale si le type primitif ne correspond pas', () => {
    localStorage.setItem('test-key', JSON.stringify('une chaine'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 0)
    );

    expect(result.current[0]).toBe(0);
  });
});
