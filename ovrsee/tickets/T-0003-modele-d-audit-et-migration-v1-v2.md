---
{
  "id": "T-0003",
  "titre": "Modèle d'audit et migration v1 vers v2",
  "colonne": "pret",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "donnees",
    "charge:l"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 2 du plan, **avant toute UI** : c'est ce qui protège les données existantes. L'app n'a
aujourd'hui qu'un état de progression anonyme dans `localStorage['rgaa-progress']`. La refonte
introduit des audits nommés, datés, reprenables, sous une nouvelle clé `rgaa-audits`.

Il n'y a pas de backend : un utilisateur peut avoir 106 critères de travail dans l'ancienne clé
et aucun moyen de les récupérer si on la supprime.

## Critères d'acceptation

- [ ] Les types `Audit` et `AuditStore` (version 2) sont dans `src/types/index.ts`.
- [ ] `src/utils/migrateProgress.ts` convertit l'ancien format `{classic, designSystem}` en
      `AuditStore`, avec un audit « Mon audit » et un second pour `designSystem` s'il est non vide.
- [ ] `localStorage['rgaa-progress']` n'est **jamais** supprimée ni écrasée.
- [ ] `src/hooks/useAudits.ts` fait le CRUD des audits et de l'audit actif sur `useLocalStorage`.
- [ ] Les écritures de notes et d'URLs passent par un debounce de 500ms avec flush au `blur`
      et au `beforeunload`.
- [ ] `migrateProgress` et `useAudits` ont leurs tests, y compris le cas d'une v1 non vide.
