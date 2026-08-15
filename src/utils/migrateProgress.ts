import type {
  Audit,
  AuditStore,
  ClassicStatus,
  DesignSystemStatus,
  Mode,
  Progress,
} from '../types';

export const EMPTY_AUDIT_STORE: AuditStore = {
  version: 2,
  audits: [],
  activeAuditId: null,
};

const CLASSIC_STATUSES: readonly ClassicStatus[] = [
  'conforme',
  'non-conforme',
  'non-applicable',
];

const DESIGN_SYSTEM_STATUSES: readonly DesignSystemStatus[] = [
  'default-compliant',
  'project-implementation',
  'non-applicable',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ne recopie que les entrées dont le statut appartient au mode visé. Les données
 * viennent du localStorage d'un utilisateur : on ne leur fait pas confiance.
 */
function sanitizeProgress(raw: unknown, allowed: readonly string[]): Record<string, { status: string }> {
  if (!isRecord(raw)) return {};

  const result: Record<string, { status: string }> = {};
  for (const [criteriaId, entry] of Object.entries(raw)) {
    if (!isRecord(entry)) continue;
    const { status } = entry;
    if (typeof status === 'string' && allowed.includes(status)) {
      result[criteriaId] = { status };
    }
  }
  return result;
}

function createAudit(name: string, mode: Mode, progress: Audit['progress']): Audit {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    mode,
    themes: [],
    createdAt: now,
    updatedAt: now,
    progress,
    notes: {},
    pages: {},
    checkedTests: {},
  };
}

/**
 * Convertit l'ancienne progression anonyme (`localStorage['rgaa-progress']`) en
 * audits nommés. Deux formats d'entrée sont acceptés : `{ criteria }`, le tout
 * premier, et `{ classic, designSystem }`, le suivant.
 *
 * L'ancienne clé n'est jamais touchée par cette fonction : sans backend, elle
 * reste le seul filet de sécurité de l'utilisateur.
 */
export function migrateProgressToAudits(raw: unknown): AuditStore {
  if (!isRecord(raw)) return EMPTY_AUDIT_STORE;

  const legacyCriteria = 'criteria' in raw ? raw.criteria : undefined;
  const classicSource = legacyCriteria !== undefined ? legacyCriteria : raw.classic;

  const classic = sanitizeProgress(classicSource, CLASSIC_STATUSES) as Progress['classic'];
  const designSystem = sanitizeProgress(raw.designSystem, DESIGN_SYSTEM_STATUSES) as Progress['designSystem'];

  const audits: Audit[] = [];
  if (Object.keys(classic).length > 0) {
    audits.push(createAudit('Mon audit', 'classic', classic));
  }
  if (Object.keys(designSystem).length > 0) {
    audits.push(createAudit('Mon audit (Design System)', 'design-system', designSystem));
  }

  if (audits.length === 0) return EMPTY_AUDIT_STORE;

  return { version: 2, audits, activeAuditId: audits[0].id };
}
