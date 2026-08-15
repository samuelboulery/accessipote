---
{
  "id": "T-0011",
  "titre": "Uniformiser les rayons et les paddings",
  "colonne": "fait",
  "priorite": "haute",
  "tags": [
    "recette",
    "design",
    "charge:m"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-retours-de-recette-sur-la-refonte-accessipote.md"
}
---

## Contexte

Le handoff fixait six valeurs de rayon, mais l'inventaire montre que trois d'entre elles
portent 53 usages sur 59 : `ctrl` 12px (34), `card` 24px (13), `pill` (6). Les trois
autres — `box` 8px, `panel` 40px, `frame` 48px — totalisent 5 usages isolés et rendent
l'ensemble illisible.

Second défaut lié : certains conteneurs à grand rayon ont un padding trop faible, si bien
que le premier enfant mord la courbe du coin au lieu de laisser un espace continu.

Deux classes mortes traînent depuis la phase 1 dans `ErrorBoundary.tsx` : `rounded-lg` et
`shadow-lg` ne produisent plus aucun style depuis le remplacement de l'échelle Tailwind.

## Critères d'acceptation

- [ ] `tailwind.config.js` et `src/tokens.css` ne déclarent plus que `ctrl`, `card` et `pill`.
- [ ] Aucune occurrence de `rounded-box`, `rounded-panel`, `rounded-frame`, `rounded-lg`
      ni `shadow-lg` dans `src/`.
- [ ] Sur chaque conteneur arrondi, le padding vaut au moins le rayon du parent moins celui
      de l'enfant : aucun enfant ne mord la courbe d'un coin.
- [ ] Les pastilles (`StatusPill`, pastilles de thème) gardent leur `py-1` — un rayon
      `pill` épouse le texte par construction, la règle ne s'y applique pas.
- [ ] La barre d'actions groupées n'est plus complètement arrondie.
