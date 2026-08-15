import { describe, it, expect } from 'vitest';
import { migrateProgressToAudits, EMPTY_AUDIT_STORE } from './migrateProgress';

describe('migrateProgressToAudits', () => {
  it('retourne un magasin vide quand il n\'y a rien à migrer', () => {
    expect(migrateProgressToAudits(null)).toEqual(EMPTY_AUDIT_STORE);
    expect(migrateProgressToAudits(undefined)).toEqual(EMPTY_AUDIT_STORE);
    expect(migrateProgressToAudits('pas un objet')).toEqual(EMPTY_AUDIT_STORE);
    expect(migrateProgressToAudits({})).toEqual(EMPTY_AUDIT_STORE);
  });

  it('ne crée aucun audit quand les deux modes sont vides', () => {
    const store = migrateProgressToAudits({ classic: {}, designSystem: {} });
    expect(store.audits).toHaveLength(0);
    expect(store.activeAuditId).toBeNull();
  });

  it('crée un audit classique à partir du format v1', () => {
    const store = migrateProgressToAudits({
      classic: { '1.1': { status: 'conforme' }, '1.2': { status: 'non-conforme' } },
      designSystem: {},
    });

    expect(store.version).toBe(2);
    expect(store.audits).toHaveLength(1);
    const [audit] = store.audits;
    expect(audit.name).toBe('Mon audit');
    expect(audit.mode).toBe('classic');
    expect(audit.progress).toEqual({
      '1.1': { status: 'conforme' },
      '1.2': { status: 'non-conforme' },
    });
    expect(audit.themes).toEqual([]);
    expect(audit.notes).toEqual({});
    expect(audit.pages).toEqual({});
    expect(audit.checkedTests).toEqual({});
    expect(store.activeAuditId).toBe(audit.id);
  });

  it('crée un second audit quand le mode design system est renseigné', () => {
    const store = migrateProgressToAudits({
      classic: { '1.1': { status: 'conforme' } },
      designSystem: { '2.1': { status: 'default-compliant' } },
    });

    expect(store.audits).toHaveLength(2);
    expect(store.audits.map(a => a.mode)).toEqual(['classic', 'design-system']);
    expect(store.audits[1].name).toBe('Mon audit (Design System)');
    expect(store.audits[1].progress).toEqual({ '2.1': { status: 'default-compliant' } });
    expect(store.activeAuditId).toBe(store.audits[0].id);
  });

  it('crée uniquement l\'audit design system quand le mode classique est vide', () => {
    const store = migrateProgressToAudits({
      classic: {},
      designSystem: { '2.1': { status: 'project-implementation' } },
    });

    expect(store.audits).toHaveLength(1);
    expect(store.audits[0].mode).toBe('design-system');
    expect(store.activeAuditId).toBe(store.audits[0].id);
  });

  it('migre le tout premier format, celui à clé « criteria »', () => {
    const store = migrateProgressToAudits({
      criteria: { '1.1': { status: 'conforme' }, '1.3': { status: 'non-applicable' } },
    });

    expect(store.audits).toHaveLength(1);
    expect(store.audits[0].mode).toBe('classic');
    expect(store.audits[0].progress).toEqual({
      '1.1': { status: 'conforme' },
      '1.3': { status: 'non-applicable' },
    });
  });

  it('écarte les statuts inconnus plutôt que de les recopier', () => {
    const store = migrateProgressToAudits({
      classic: { '1.1': { status: 'conforme' }, '1.2': { status: 'n-importe-quoi' } },
      designSystem: {},
    });

    expect(store.audits[0].progress).toEqual({ '1.1': { status: 'conforme' } });
  });

  it('écarte les entrées mal formées sans faire échouer la migration', () => {
    const store = migrateProgressToAudits({
      classic: { '1.1': { status: 'conforme' }, '1.2': null, '1.3': 'conforme', '1.4': {} },
      designSystem: {},
    });

    expect(store.audits[0].progress).toEqual({ '1.1': { status: 'conforme' } });
  });

  it('donne des identifiants distincts et des dates ISO aux audits créés', () => {
    const store = migrateProgressToAudits({
      classic: { '1.1': { status: 'conforme' } },
      designSystem: { '2.1': { status: 'default-compliant' } },
    });

    const [a, b] = store.audits;
    expect(a.id).not.toBe(b.id);
    expect(a.id).toBeTruthy();
    expect(new Date(a.createdAt).toISOString()).toBe(a.createdAt);
    expect(a.updatedAt).toBe(a.createdAt);
  });

  it('ne mute pas la valeur d\'entrée', () => {
    const input = { classic: { '1.1': { status: 'conforme' } }, designSystem: {} };
    const snapshot = JSON.parse(JSON.stringify(input));
    migrateProgressToAudits(input);
    expect(input).toEqual(snapshot);
  });
});
