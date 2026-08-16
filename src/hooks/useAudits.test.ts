import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudits } from './useAudits';
import type { AuditProgress } from '../types';
import { AUDITS_STORAGE_KEY, LOCAL_STORAGE_KEY } from '../constants';

function readStore() {
  return JSON.parse(window.localStorage.getItem(AUDITS_STORAGE_KEY) ?? 'null');
}

describe('useAudits', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('démarre sans aucun audit quand le stockage est vide', () => {
    const { result } = renderHook(() => useAudits());

    expect(result.current.audits).toEqual([]);
    expect(result.current.activeAudit).toBeNull();
  });

  it('crée un audit et l\'active', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({
        name: 'Refonte lamairie.fr',
        scope: 'https://www.lamairie.fr',
        mode: 'classic',
        themes: ['Images'],
      });
    });

    expect(result.current.audits).toHaveLength(1);
    expect(result.current.activeAudit?.name).toBe('Refonte lamairie.fr');
    expect(result.current.activeAudit?.scope).toBe('https://www.lamairie.fr');
    expect(result.current.activeAudit?.mode).toBe('classic');
    expect(result.current.activeAudit?.themes).toEqual(['Images']);
    expect(result.current.activeAudit?.progress).toEqual({});
    expect(readStore().audits).toHaveLength(1);
  });

  it('met à jour un audit et rafraîchit sa date de modification', async () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const before = result.current.activeAudit!;

    await new Promise(r => setTimeout(r, 2));
    act(() => {
      result.current.updateAudit(before.id, { progress: { '1.1': { status: 'conforme' } } });
    });

    const after = result.current.activeAudit!;
    expect(after.progress).toEqual({ '1.1': { status: 'conforme' } });
    expect(after.createdAt).toBe(before.createdAt);
    expect(new Date(after.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before.updatedAt).getTime(),
    );
  });

  it('ne mute pas l\'audit d\'origine lors d\'une mise à jour', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const before = result.current.activeAudit!;

    act(() => {
      result.current.updateAudit(before.id, { name: 'B' });
    });

    expect(before.name).toBe('A');
    expect(result.current.activeAudit?.name).toBe('B');
  });

  it('enchaîne plusieurs mises à jour fonctionnelles dans le même tick', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const { id } = result.current.activeAudit!;

    // Ce que fait une action groupée : un appel par critère, tous avant le
    // prochain rendu. Chaque patch doit voir l'audit issu du précédent.
    act(() => {
      for (const criteriaId of ['1.1', '1.2', '1.3']) {
        result.current.updateAudit(id, audit => ({
          progress: {
            ...audit.progress,
            [criteriaId]: { status: 'conforme' },
          } as AuditProgress,
        }));
      }
    });

    expect(result.current.activeAudit?.progress).toEqual({
      '1.1': { status: 'conforme' },
      '1.2': { status: 'conforme' },
      '1.3': { status: 'conforme' },
    });
  });

  it('ignore la mise à jour d\'un audit inconnu', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });

    act(() => {
      result.current.updateAudit('identifiant-absent', { name: 'B' });
    });

    expect(result.current.audits).toHaveLength(1);
    expect(result.current.audits[0].name).toBe('A');
  });

  it('supprime un audit et désactive celui qui était actif', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const id = result.current.activeAudit!.id;

    act(() => {
      result.current.deleteAudit(id);
    });

    expect(result.current.audits).toEqual([]);
    expect(result.current.activeAudit).toBeNull();
  });

  it('garde l\'audit actif intact quand on en supprime un autre', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const actif = result.current.activeAudit!.id;
    act(() => {
      result.current.createAudit({ name: 'B', mode: 'classic', themes: [] });
    });
    const autre = result.current.activeAudit!.id;
    act(() => {
      result.current.setActiveAuditId(actif);
    });

    act(() => {
      result.current.deleteAudit(autre);
    });

    expect(result.current.activeAudit?.id).toBe(actif);
  });

  it('change d\'audit actif', () => {
    const { result } = renderHook(() => useAudits());

    act(() => {
      result.current.createAudit({ name: 'A', mode: 'classic', themes: [] });
    });
    const premier = result.current.activeAudit!.id;
    act(() => {
      result.current.createAudit({ name: 'B', mode: 'design-system', themes: [] });
    });

    expect(result.current.activeAudit?.name).toBe('B');

    act(() => {
      result.current.setActiveAuditId(premier);
    });
    expect(result.current.activeAudit?.name).toBe('A');

    act(() => {
      result.current.setActiveAuditId(null);
    });
    expect(result.current.activeAudit).toBeNull();
  });

  it('reprend les données v1 au premier chargement sans effacer l\'ancienne clé', () => {
    const v1 = { classic: { '1.1': { status: 'conforme' } }, designSystem: {} };
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(v1));

    const { result } = renderHook(() => useAudits());

    expect(result.current.audits).toHaveLength(1);
    expect(result.current.activeAudit?.name).toBe('Mon audit');
    expect(result.current.activeAudit?.progress).toEqual({ '1.1': { status: 'conforme' } });
    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(JSON.stringify(v1));
  });

  it('persiste la migration pour ne pas la rejouer au chargement suivant', () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ classic: { '1.1': { status: 'conforme' } }, designSystem: {} }),
    );

    const premier = renderHook(() => useAudits());
    const idInitial = premier.result.current.activeAudit!.id;
    premier.unmount();

    const second = renderHook(() => useAudits());
    expect(second.result.current.activeAudit?.id).toBe(idInitial);
  });

  it('ne rejoue pas la migration quand un magasin v2 existe déjà', () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ classic: { '1.1': { status: 'conforme' } }, designSystem: {} }),
    );
    window.localStorage.setItem(
      AUDITS_STORAGE_KEY,
      JSON.stringify({ version: 2, audits: [], activeAuditId: null }),
    );

    const { result } = renderHook(() => useAudits());

    expect(result.current.audits).toEqual([]);
  });

  it('relit le magasin persisté au montage suivant', () => {
    const premier = renderHook(() => useAudits());
    act(() => {
      premier.result.current.createAudit({ name: 'Persisté', mode: 'classic', themes: [] });
    });
    premier.unmount();

    const second = renderHook(() => useAudits());
    expect(second.result.current.audits).toHaveLength(1);
    expect(second.result.current.activeAudit?.name).toBe('Persisté');
  });
});
