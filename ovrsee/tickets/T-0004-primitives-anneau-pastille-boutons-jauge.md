---
{
  "id": "T-0004",
  "titre": "Primitives — anneau, pastille, boutons, jauge",
  "colonne": "fait",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "composants",
    "charge:l"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 3 du plan. Cinq primitives dont tout le reste dépend, à construire et tester isolément
avant d'être consommées par les écrans.

`StatusPill` porte la règle absolue de la refonte : jamais la couleur seule. Trois pastilles qui
ne diffèrent que par leur teinte sont un échec RGAA, même à 7:1 de contraste — chacune porte une
icône de forme distincte et un libellé.

## Critères d'acceptation

- [ ] `AuditRing.tsx` : SVG, trois tailles (48/56/128), épaisseur = diamètre / 8,
      `stroke-dasharray` calculé et jamais écrit à la main, `role="img"` + `aria-label` en clair.
- [ ] Le pourcentage d'un anneau est **toujours** aussi écrit en texte à côté.
- [ ] `StatusPill.tsx` : icône de forme distincte + libellé + fond, pour les quatre statuts.
- [ ] `StatusButtons.tsx` : `role="radiogroup"` avec `aria-label` nommant le critère,
      `role="radio"` + `aria-checked` par bouton ; trois densités ; un second clic sur le statut
      actif l'efface (comportement conservé depuis `useProgress`).
- [ ] Aucune cible interactive sous 44×44, y compris quand la hauteur visuelle est de 40px.
- [ ] `SegmentedGauge.tsx` : 2px de blanc entre chaque segment, `role="img"` + `aria-label`
      énonçant la répartition complète.
- [ ] `Sidebar.tsx` : 244px, logo, sélecteur d'audit, nav de 4 liens avec `aria-current="page"`
      sur l'actif, carte « Cet audit », indicateur de sauvegarde.
