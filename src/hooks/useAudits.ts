import { useCallback, useMemo } from 'react';
import type { Audit, AuditStore, Mode } from '../types';
import useLocalStorage from './useLocalStorage';
import { AUDITS_STORAGE_KEY, LOCAL_STORAGE_KEY } from '../constants';
import { migrateProgressToAudits, EMPTY_AUDIT_STORE } from '../utils/migrateProgress';
import { logError } from '../utils/logger';

export interface NewAuditInput {
  name: string;
  scope?: string;
  mode: Mode;
  themes: string[];
}

/**
 * `useLocalStorage` ne sait migrer que depuis sa propre clé ; la v1 vit sous une
 * autre. On lit donc `rgaa-progress` ici, une seule fois, pour amorcer le magasin
 * v2 quand il n'existe pas encore. L'ancienne clé n'est jamais réécrite.
 */
function initialStore(): AuditStore {
  if (typeof window === 'undefined') return EMPTY_AUDIT_STORE;
  if (window.localStorage.getItem(AUDITS_STORAGE_KEY) !== null) return EMPTY_AUDIT_STORE;

  try {
    const legacy = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!legacy) return EMPTY_AUDIT_STORE;

    const migrated = migrateProgressToAudits(JSON.parse(legacy));
    // Persister tout de suite : sans ça, la migration rejouerait à chaque
    // chargement et regénérerait des identifiants d'audit différents.
    if (migrated.audits.length > 0) {
      window.localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (error) {
    logError('Migration de la progression v1 impossible:', error);
    return EMPTY_AUDIT_STORE;
  }
}

export function useAudits() {
  const bootstrap = useMemo(initialStore, []);
  const [store, setStore] = useLocalStorage<AuditStore>(AUDITS_STORAGE_KEY, bootstrap);

  const createAudit = useCallback((input: NewAuditInput): string => {
    const now = new Date().toISOString();
    const audit: Audit = {
      id: crypto.randomUUID(),
      name: input.name,
      scope: input.scope,
      mode: input.mode,
      themes: input.themes,
      createdAt: now,
      updatedAt: now,
      progress: {},
      notes: {},
      pages: {},
      checkedTests: {},
    };

    setStore(prev => ({
      ...prev,
      audits: [...prev.audits, audit],
      activeAuditId: audit.id,
    }));

    return audit.id;
  }, [setStore]);

  const updateAudit = useCallback((id: string, patch: Partial<Omit<Audit, 'id' | 'createdAt'>>) => {
    setStore(prev => ({
      ...prev,
      audits: prev.audits.map(audit =>
        audit.id === id ? { ...audit, ...patch, updatedAt: new Date().toISOString() } : audit,
      ),
    }));
  }, [setStore]);

  const deleteAudit = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      audits: prev.audits.filter(audit => audit.id !== id),
      activeAuditId: prev.activeAuditId === id ? null : prev.activeAuditId,
    }));
  }, [setStore]);

  const setActiveAuditId = useCallback((id: string | null) => {
    setStore(prev => ({ ...prev, activeAuditId: id }));
  }, [setStore]);

  const activeAudit = useMemo(
    () => store.audits.find(audit => audit.id === store.activeAuditId) ?? null,
    [store.audits, store.activeAuditId],
  );

  return {
    audits: store.audits,
    activeAudit,
    createAudit,
    updateAudit,
    deleteAudit,
    setActiveAuditId,
  };
}
