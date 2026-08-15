---
{
  "id": "T-0001",
  "titre": "Refonte hifi — direction retenue",
  "colonne": "en-cours",
  "priorite": "haute",
  "type": "epic",
  "tags": [
    "refonte",
    "charge:xl"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Le handoff de design (`~/Downloads/design_handoff_accessipote_redesign/`) refond trois choses
sans toucher aux données, calculs ni exports : la structure de navigation (barre latérale de
244px et quatre destinations au lieu de deux onglets), le modèle de données de surface (audits
nommés reprenables au lieu d'un état anonyme unique) et la direction visuelle (noir et blanc
portent la hiérarchie, la couleur ne dit plus que le statut, teintes calées sur AAA 7:1).

Cet epic regroupe les neuf phases d'implémentation. Chaque phase est un ticket enfant et un
commit sur la branche `feature/redesign-hifi`.

## Critères d'acceptation

- [ ] Les neuf tickets enfants sont en colonne finale.
- [ ] Toute la checklist « Critères de recette » du README du handoff est cochée.
- [ ] `pnpm lint`, `pnpm build` et `pnpm test:run` passent.
- [ ] Les tests de `calculateSummaryStats`, `exportMarkdown`, `useProgress` et
      `transformCriteria` passent **sans modification**.
- [ ] Un utilisateur avec des données v1 (`localStorage['rgaa-progress']`) les retrouve dans un
      audit nommé, et l'ancienne clé n'a pas été supprimée.
