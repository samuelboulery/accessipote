import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilters } from './useFilters';
import type { CriteriaRGAA, CriteriaFilters } from '../types';

// Données de test
const mockCriteria: CriteriaRGAA[] = [
  {
    id: '1.1',
    title: 'Critère Test 1',
    description: 'Description 1',
    url: 'http://example.com',
    theme: 'Images',
    level: 'A',
  },
  {
    id: '2.1',
    title: 'Critère Test 2',
    description: 'Description 2',
    url: 'http://example.com',
    theme: 'Images',
    level: 'AA',
  },
  {
    id: '3.1',
    title: 'Critère Test 3',
    description: 'Description 3',
    url: 'http://example.com',
    theme: 'Couleurs',
    level: 'AAA',
  },
];

describe('useFilters', () => {
  it('devrait retourner tous les critères sans filtres', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(3);
  });

  it('devrait filtrer par recherche textuelle (titre)', () => {
    const filters: CriteriaFilters = {
      search: 'Test 1',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('1.1');
  });

  it('devrait filtrer par recherche textuelle (ID)', () => {
    const filters: CriteriaFilters = {
      search: '2.1',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('2.1');
  });

  it('devrait filtrer par recherche textuelle (description)', () => {
    const filters: CriteriaFilters = {
      search: 'Description 3',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('3.1');
  });

  it('devrait filtrer par thème', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: ['Images'],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(2);
    expect(result.current.filteredCriteria.every(c => c.theme === 'Images')).toBe(true);
  });

  it('devrait filtrer par niveau', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: 'A',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].level).toBe('A');
  });

  it('devrait filtrer par statut', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: '',
      status: 'conforme',
    };

    const progress = {
      '1.1': { status: 'conforme' },
      '2.1': { status: 'non-conforme' },
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, progress)
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('1.1');
  });

  it('devrait combiner plusieurs filtres', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: ['Images'],
      level: 'AA',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('2.1');
  });

  it('devrait retourner les thèmes uniques', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.uniqueThemes).toEqual(['Images', 'Couleurs']);
  });

  it('devrait retourner les niveaux uniques', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.uniqueLevels).toEqual(['A', 'AA', 'AAA']);
  });

  it('devrait calculer le pourcentage de progression', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: [],
      level: '',
      status: '',
    };

    const progress = {
      '1.1': { status: 'conforme' },
      '2.1': { status: 'non-conforme' },
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, progress)
    );

    // 2 critères complétés sur 3 = 66.67%
    expect(result.current.progressPercentage).toBeCloseTo(66.67, 1);
  });

  it('devrait calculer le pourcentage de progression avec filtres de thème', () => {
    const filters: CriteriaFilters = {
      search: '',
      themes: ['Images'],
      level: '',
      status: '',
    };

    const progress = {
      '1.1': { status: 'conforme' },
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, progress)
    );

    // 1 critère complété sur 2 pour le thème Images = 50%
    expect(result.current.progressPercentage).toBe(50);
  });

  it('devrait gérer la recherche insensible à la casse', () => {
    const filters: CriteriaFilters = {
      search: 'TEST',
      themes: [],
      level: '',
      status: '',
    };

    const { result } = renderHook(() =>
      useFilters(mockCriteria, filters, {})
    );

    expect(result.current.filteredCriteria).toHaveLength(3);
  });
});
