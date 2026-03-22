import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from './useProgress';
import type { Progress, CriteriaRGAA } from '../types';

const mockCriteria: CriteriaRGAA[] = [
  { id: '1.1', title: 'Critère 1.1', url: '', theme: 'Images', level: 'A' },
  { id: '1.2', title: 'Critère 1.2', url: '', theme: 'Images', level: 'A' },
  { id: '2.1', title: 'Critère 2.1', url: '', theme: 'Couleurs', level: 'AA' },
];

const initialProgress: Progress = {
  classic: {},
  designSystem: {},
};

describe('useProgress', () => {
  describe('handleCriteriaStatusChange', () => {
    it('devrait mettre à jour le statut d\'un critère en mode classic', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleCriteriaStatusChange('1.1', 'conforme');
      });

      expect(setProgress).toHaveBeenCalledWith({
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      });
    });

    it('devrait mettre à jour le statut d\'un critère en mode design-system', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'design-system', mockCriteria)
      );

      act(() => {
        result.current.handleCriteriaStatusChange('1.1', 'default-compliant');
      });

      expect(setProgress).toHaveBeenCalledWith({
        classic: {},
        designSystem: { '1.1': { status: 'default-compliant' } },
      });
    });

    it('devrait supprimer le statut si la valeur est vide', () => {
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      };
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleCriteriaStatusChange('1.1', '');
      });

      const call = setProgress.mock.calls[0][0];
      expect(call.classic['1.1']).toBeUndefined();
    });

    it('devrait supprimer le statut si la valeur est falsy', () => {
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: {},
      };
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleCriteriaStatusChange('1.1', '');
      });

      const call = setProgress.mock.calls[0][0];
      expect('1.1' in call.classic).toBe(false);
    });
  });

  describe('handleSelectAll', () => {
    it('devrait appliquer un statut classic valide à tous les critères filtrés', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleSelectAll('conforme');
      });

      const call = setProgress.mock.calls[0][0];
      expect(call.classic['1.1']).toEqual({ status: 'conforme' });
      expect(call.classic['1.2']).toEqual({ status: 'conforme' });
      expect(call.classic['2.1']).toEqual({ status: 'conforme' });
    });

    it('devrait appliquer non-conforme à tous les critères filtrés en mode classic', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleSelectAll('non-conforme');
      });

      const call = setProgress.mock.calls[0][0];
      expect(call.classic['1.1']).toEqual({ status: 'non-conforme' });
    });

    it('devrait rejeter un statut design-system en mode classic', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleSelectAll('default-compliant');
      });

      expect(setProgress).not.toHaveBeenCalled();
    });

    it('devrait appliquer un statut design-system valide en mode design-system', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'design-system', mockCriteria)
      );

      act(() => {
        result.current.handleSelectAll('project-implementation');
      });

      const call = setProgress.mock.calls[0][0];
      expect(call.designSystem['1.1']).toEqual({ status: 'project-implementation' });
      expect(call.designSystem['2.1']).toEqual({ status: 'project-implementation' });
    });

    it('devrait rejeter un statut classic en mode design-system', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'design-system', mockCriteria)
      );

      act(() => {
        result.current.handleSelectAll('conforme');
      });

      expect(setProgress).not.toHaveBeenCalled();
    });

    it('devrait appliquer non-applicable en mode classic', () => {
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(initialProgress, setProgress, 'classic', [mockCriteria[0]])
      );

      act(() => {
        result.current.handleSelectAll('non-applicable');
      });

      const call = setProgress.mock.calls[0][0];
      expect(call.classic['1.1']).toEqual({ status: 'non-applicable' });
    });
  });

  describe('handleDeselectAll', () => {
    it('devrait effacer les statuts des critères filtrés', () => {
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '1.2': { status: 'non-conforme' },
          '2.1': { status: 'conforme' },
        },
        designSystem: {},
      };
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'classic', mockCriteria)
      );

      act(() => {
        result.current.handleDeselectAll();
      });

      const call = setProgress.mock.calls[0][0];
      expect('1.1' in call.classic).toBe(false);
      expect('1.2' in call.classic).toBe(false);
      expect('2.1' in call.classic).toBe(false);
    });

    it('devrait effacer uniquement les critères filtrés', () => {
      const progress: Progress = {
        classic: {
          '1.1': { status: 'conforme' },
          '3.1': { status: 'conforme' },
        },
        designSystem: {},
      };
      const setProgress = vi.fn();
      // Filtrer uniquement 1.1
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'classic', [mockCriteria[0]])
      );

      act(() => {
        result.current.handleDeselectAll();
      });

      const call = setProgress.mock.calls[0][0];
      expect('1.1' in call.classic).toBe(false);
      // 3.1 n'est pas dans les critères filtrés, il doit rester
      expect(call.classic['3.1']).toEqual({ status: 'conforme' });
    });
  });

  describe('currentProgress', () => {
    it('devrait retourner le progrès du mode classic', () => {
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: { '1.1': { status: 'default-compliant' } },
      };
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'classic', mockCriteria)
      );

      expect(result.current.currentProgress).toEqual({ '1.1': { status: 'conforme' } });
    });

    it('devrait retourner le progrès du mode design-system', () => {
      const progress: Progress = {
        classic: { '1.1': { status: 'conforme' } },
        designSystem: { '1.1': { status: 'default-compliant' } },
      };
      const setProgress = vi.fn();
      const { result } = renderHook(() =>
        useProgress(progress, setProgress, 'design-system', mockCriteria)
      );

      expect(result.current.currentProgress).toEqual({ '1.1': { status: 'default-compliant' } });
    });
  });
});
