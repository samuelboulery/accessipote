import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilters } from './useFilters';
import type { CriteriaRGAA, CriteriaFilters } from '../types';

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
      level: '',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(3);
  });

  it('devrait filtrer par recherche textuelle (titre)', () => {
    const filters: CriteriaFilters = {
      search: 'Test 1',
      level: '',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('1.1');
  });

  it('devrait filtrer par recherche textuelle (ID)', () => {
    const filters: CriteriaFilters = {
      search: '2.1',
      level: '',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('2.1');
  });

  it('devrait filtrer par recherche textuelle (description)', () => {
    const filters: CriteriaFilters = {
      search: 'Description 3',
      level: '',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('3.1');
  });

  it('devrait filtrer par niveau', () => {
    const filters: CriteriaFilters = {
      search: '',
      level: 'A',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].level).toBe('A');
  });

  it('devrait filtrer par statut', () => {
    const filters: CriteriaFilters = {
      search: '',
      level: '',
      status: 'conforme',
    };

    const progress = {
      '1.1': { status: 'conforme' },
      '2.1': { status: 'non-conforme' },
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, progress));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('1.1');
  });

  it('devrait combiner niveau et statut', () => {
    const filters: CriteriaFilters = {
      search: '',
      level: 'AA',
      status: 'non-conforme',
    };

    const progress = {
      '2.1': { status: 'non-conforme' },
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, progress));

    expect(result.current.filteredCriteria).toHaveLength(1);
    expect(result.current.filteredCriteria[0].id).toBe('2.1');
  });

  it('devrait retourner les thèmes uniques', () => {
    const filters: CriteriaFilters = { search: '', level: '', status: '' };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.uniqueThemes).toEqual(['Images', 'Couleurs']);
  });

  it('devrait retourner les niveaux uniques', () => {
    const filters: CriteriaFilters = { search: '', level: '', status: '' };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.uniqueLevels).toEqual(['A', 'AA', 'AAA']);
  });

  it('devrait gérer la recherche insensible à la casse', () => {
    const filters: CriteriaFilters = {
      search: 'TEST',
      level: '',
      status: '',
    };

    const { result } = renderHook(() => useFilters(mockCriteria, filters, {}));

    expect(result.current.filteredCriteria).toHaveLength(3);
  });
});

describe('useFilters — ce qui reste à évaluer, ce que le scan a laissé', () => {
  const none: CriteriaFilters = { search: '', level: '', status: '' };
  const progress = { '1.1': { status: 'conforme' } };
  const marks = {
    auto: { '1.1': {} },
    leads: { '2.1': {} },
  };
  const ids = (filters: CriteriaFilters) =>
    renderHook(() => useFilters(mockCriteria, filters, progress, marks)).result.current.filteredCriteria.map(
      criterion => criterion.id,
    );

  it('« À évaluer » retient les critères sans statut', () => {
    expect(ids({ ...none, status: 'a-evaluer' })).toEqual(['2.1', '3.1']);
  });

  it('retient les critères pré-remplis par le scan', () => {
    expect(ids({ ...none, scan: 'auto' })).toEqual(['1.1']);
  });

  it('retient les critères qui portent des pistes du scan', () => {
    expect(ids({ ...none, scan: 'leads' })).toEqual(['2.1']);
  });

  it('se combine au statut : à évaluer, avec pistes', () => {
    expect(ids({ ...none, status: 'a-evaluer', scan: 'leads' })).toEqual(['2.1']);
  });

  it('sans marques du scan, le filtre Scan ne retient rien', () => {
    const { result } = renderHook(() => useFilters(mockCriteria, { ...none, scan: 'leads' }, {}));
    expect(result.current.filteredCriteria).toEqual([]);
  });
});
