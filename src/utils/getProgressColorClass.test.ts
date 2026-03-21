import { describe, it, expect } from 'vitest';
import { getProgressColorClass } from './getProgressColorClass';

describe('getProgressColorClass', () => {
  it('retourne bg-red-500 pour une valeur inférieure à 50', () => {
    expect(getProgressColorClass(0)).toBe('bg-red-500');
    expect(getProgressColorClass(25)).toBe('bg-red-500');
    expect(getProgressColorClass(49)).toBe('bg-red-500');
  });

  it('retourne bg-yellow-500 pour une valeur entre 50 et 79', () => {
    expect(getProgressColorClass(50)).toBe('bg-yellow-500');
    expect(getProgressColorClass(65)).toBe('bg-yellow-500');
    expect(getProgressColorClass(79)).toBe('bg-yellow-500');
  });

  it('retourne bg-green-500 pour une valeur supérieure ou égale à 80', () => {
    expect(getProgressColorClass(80)).toBe('bg-green-500');
    expect(getProgressColorClass(90)).toBe('bg-green-500');
    expect(getProgressColorClass(100)).toBe('bg-green-500');
  });
});
