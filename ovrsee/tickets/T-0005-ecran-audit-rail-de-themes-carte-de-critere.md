---
{
  "id": "T-0005",
  "titre": "Écran audit — rail de thèmes et carte de critère",
  "colonne": "pret",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "ecran",
    "charge:xl"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 4 du plan, blocs 02 et 03 du handoff. L'audit se parcourt désormais **un thème à la fois**
au lieu d'une liste plate de 106 critères. Le plus gros thème fait 14 critères : la
virtualisation `@tanstack/react-virtual` devient inutile et nuisible — elle empêche `Ctrl+F`,
casse le focus au défilement et complique le lien profond depuis le glossaire.

Les trois grands boutons de mode en haut de page disparaissent : le mode se choisit une fois, à
la création de l'audit.

## Critères d'acceptation

- [ ] Le `<div role="tablist">` Audit/Synthèse et son `activeTab` ont disparu de `App.tsx`,
      remplacés par `view: 'home' | 'audit' | 'summary' | 'glossary'` en state.
- [ ] `ThemeRail.tsx` : sélection unique, `role="tablist"` navigable aux flèches, ratio en mono
      et coche quand le thème est complet, débordement en défilement horizontal jamais en retour
      à la ligne.
- [ ] `@tanstack/react-virtual` est retiré de `CriteriaList.tsx` et de `package.json`.
- [ ] `handleCriteriaClick` n'utilise plus `scrollIntoView` avec `setTimeout(100)` : il bascule
      le thème puis appelle `element.focus()`.
- [ ] `CriteriaItem.tsx` : carte au statut (fond + bordure), ligne de méta, intitulé `<h3>`,
      `StatusButtons` ; l'ancre `id={`criteria-${id}`}` est conservée pour le lien profond.
- [ ] `CriteriaDetail.tsx` : tests cochables un par un, note d'audit, pages concernées, encart de
      glossaire, pied de navigation nommant le critère cible.
- [ ] `ModeSelector.tsx` et `ThemeSelector.tsx` sont supprimés avec leurs tests.
