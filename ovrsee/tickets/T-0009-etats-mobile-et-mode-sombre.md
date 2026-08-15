---
{
  "id": "T-0009",
  "titre": "États, mobile et mode sombre",
  "colonne": "en-cours",
  "priorite": "moyenne",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "mobile",
    "charge:l"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 8 du plan, blocs 06, 07 et 08 du handoff.

Aujourd'hui « tout sélectionner » agit sur la liste filtrée courante : l'utilisateur ne voit pas
ce qu'il va modifier. La sélection devient explicite, une case par carte, et la barre d'actions
groupées annonce son cardinal.

En sombre, les teintes de statut sont **éclaircies**, pas assombries : reprendre les teintes
claires sur fond noir donnerait 2:1 au lieu de 7:1.

## Critères d'acceptation

- [ ] `BulkActions.tsx` : une case par carte, barre noire qui n'apparaît qu'avec une sélection,
      annonce son cardinal, quatre actions dont « Effacer le statut ».
- [ ] `EmptyState.tsx` : le message dit ce qui a été cherché **et** ce qui existe ailleurs,
      jamais un « Aucun résultat » sec.
- [ ] Écran d'export : trois formats en radio, quatre cases de contenu ; `exportMarkdown.ts` et
      l'export PDF existants restent la mécanique.
- [ ] `KeyboardShortcutsModal.tsx` restylé, liste de raccourcis conservée et étendue.
- [ ] Mobile 390px : barre d'onglets basse, toutes les cibles à 48px minimum, boutons de statut
      en colonne, rail de thèmes en feuille glissante.
- [ ] En sombre : teintes de statut éclaircies à 7:1 sur `#131313`, tuile de logo inversée,
      anneau de focus inversé.
