---
{
  "id": "T-0016",
  "titre": "Responsive et états vides",
  "type": "epic",
  "colonne": "revue",
  "priorite": "haute",
  "tags": [
    "responsive",
    "ux"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-responsive-etats-vides-apercu-grise.md"
}
---

## Contexte

La refonte visuelle a été livrée sans passe responsive : douze classes de
breakpoint en tout, sur sept fichiers. Deux manques se cumulent — l'app se
déforme du téléphone au grand écran, et les écrans sans audit n'affichent qu'un
paragraphe gris.

La cause commune du premier problème est structurelle : les breakpoints Tailwind
mesurent la fenêtre, alors que la zone de contenu vaut `fenêtre − 244px de
sidebar − 48px de padding`. Toutes les mises en page deux colonnes se
déclenchent donc environ 290px trop tôt.

## Critères d'acceptation

- [ ] Aucun débordement horizontal de 320px à 1600px, sur les quatre vues, en clair et en sombre
- [ ] Aucune mise en page deux colonnes ne se déclenche tant que le contenu ne dépasse pas 800px
- [ ] Les vues Audit et Synthèse sans audit montrent un aperçu grisé de l'écran à venir, avec une action utile
- [ ] `pnpm lint && pnpm build && pnpm test:run` verts
