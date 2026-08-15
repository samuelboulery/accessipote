---
{
  "id": "T-0007",
  "titre": "Synthèse et corrections d'accessibilité",
  "colonne": "fait",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "ecran",
    "a11y",
    "charge:l"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 6 du plan, bloc 04 du handoff. Cet écran porte les deux corrections d'accessibilité les
plus importantes du lot — ce sont des critères RGAA, pas des préférences.

Le bug le plus coûteux de l'écran est la divergence des compteurs : un anneau à 39 %, un libellé
« 41 / 106 » et une légende totalisant 48. `calculateSummaryStats` distingue déjà correctement
**évalués** (conforme + nonConforme + nonApplicable, pour l'avancement) de **tranchés**
(conforme + nonConforme, pour le taux de conformité) — c'est l'affichage qui les confondait.

## Critères d'acceptation

- [ ] Aucune information portée par la seule couleur : le tableau par thème porte quatre colonnes
      chiffrées avec icône en en-tête, les barres ne font qu'illustrer ces nombres.
- [ ] La légende du donut porte icône + libellé + nombre + pourcentage, et le donut a un
      `aria-label` énonçant la répartition complète.
- [ ] Chaque jauge multi-segments a 2px de séparation ; le donut a 4px d'arc vide entre segments.
- [ ] Tous les compteurs de l'écran dérivent d'un unique objet issu de `calculateSummaryStats`,
      et « évalués » n'est jamais confondu avec « tranchés ».
- [ ] `<table>` avec `scope="col"` sur chaque en-tête et `scope="row"` sur le nom de thème.
- [ ] `calculateSummaryStats.ts` est inchangé et ses tests passent sans modification.
- [ ] `ProgressBar.tsx` et `getProgressColorClass.ts` sont supprimés avec leurs tests.
