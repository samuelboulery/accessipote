---
{
  "id": "T-0012",
  "titre": "Compléter la sélection groupée",
  "colonne": "fait",
  "priorite": "haute",
  "tags": [
    "recette",
    "charge:s"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-retours-de-recette-sur-la-refonte-accessipote.md"
}
---

## Contexte

Chaque carte de critère porte une case de sélection, mais rien ne permet de tout
sélectionner ou tout désélectionner d'un coup : sur un thème de quatorze critères, il faut
quatorze clics.

L'ancien « tout sélectionner » avait été retiré parce qu'il agissait sur la liste filtrée
sans que l'utilisateur voie ce qu'il modifiait. Avec des cases visibles sur chaque carte,
l'objection tombe : la case maîtresse agit sur exactement ce qui est à l'écran.

## Critères d'acceptation

- [ ] Une case maîtresse dans l'en-tête de thème sélectionne et désélectionne tous les
      critères actuellement affichés.
- [ ] Elle est à l'état indéterminé quand la sélection est partielle.
- [ ] Elle n'agit que sur les critères visibles, filtres actifs compris.
- [ ] La barre d'actions groupées conserve « Tout désélectionner ».
