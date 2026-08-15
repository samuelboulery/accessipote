---
{
  "id": "T-0018",
  "titre": "Correctifs téléphone et bugs de bornage",
  "colonne": "revue",
  "priorite": "haute",
  "tags": [
    "responsive",
    "mobile",
    "a11y"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-responsive-etats-vides-apercu-grise.md",
  "epic": "T-0016"
}
---

## Contexte

Sous 640px, plusieurs éléments débordent ou se recouvrent. Trois d'entre eux
sont de vrais bugs, pas des approximations de style :

- `GlossaryPopover.tsx:49` — le bornage `Math.min(Math.max(8, anchor.left), innerWidth - 320 - 8)` devient négatif sous 336px de large : le popover sort de l'écran par la gauche.
- `BulkActions.tsx:33` — `sticky bottom-4` place la barre d'actions groupées **sous** la `MobileTabBar`, qui est fixe et haute de 64px.
- `ThemeSummaryTable.tsx:24` — le conteneur `overflow-x-auto` n'est pas focalisable : son défilement horizontal est inatteignable au clavier (WCAG 2.1.1).

S'y ajoutent le titre d'accueil en 3,5 rem sans variante mobile, la barre
d'outils de l'audit sans `flex-wrap`, l'absence de zone sûre iOS sur la barre
d'onglets, le popover de filtres non borné, et le double défilement du glossaire
une fois passé en colonne.

## Critères d'acceptation

- [ ] À 320px, le popover du glossaire est entièrement visible et sa largeur s'adapte à la fenêtre
- [ ] La barre d'actions groupées reste au-dessus de la barre d'onglets en mobile
- [ ] Le tableau de synthèse est atteignable au clavier et son défilement horizontal annoncé (`role="region"` + `aria-label`)
- [ ] Le titre d'accueil reste lisible à 320px
- [ ] La barre de recherche, les filtres et l'export passent à la ligne sous 640px
- [ ] La barre d'onglets respecte `env(safe-area-inset-bottom)`
- [ ] Le glossaire ne produit qu'un seul niveau de défilement sous 1100px
- [ ] Tests : bornage du popover à `innerWidth = 320`, focalisabilité du tableau
