---
{
  "id": "T-0013",
  "titre": "Sélecteur d'audit et pied de barre latérale",
  "colonne": "fait",
  "priorite": "haute",
  "tags": [
    "recette",
    "charge:m"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-retours-de-recette-sur-la-refonte-accessipote.md"
}
---

## Contexte

Le bouton en haut de la barre latérale annonce un sélecteur d'audit — nom, mode, chevrons
haut-bas — mais renvoie à l'accueil. Il promet une chose et en fait une autre.

Deux autres éléments sont mal placés ou incomplets dans cette colonne : la bascule
clair/sombre n'existe que dans la barre d'outils de l'écran Audit, donc inatteignable
depuis la synthèse ou le glossaire ; et l'indicateur de sauvegarde flotte sous la carte
d'audit, ne dit pas ce qui a été modifié et se fige au lieu de se rafraîchir.

## Critères d'acceptation

- [ ] Le sélecteur ouvre un popover listant les audits ; en choisir un bascule dessus sans
      quitter l'écran courant.
- [ ] L'audit actif y est identifiable autrement que par la couleur.
- [ ] Le popover se ferme par Échap et par un clic à l'extérieur.
- [ ] Il propose « Voir tous les audits » et « Nouvel audit ».
- [ ] La bascule clair/sombre est atteignable depuis les quatre destinations.
- [ ] En tactile elle est présente sans être annoncée comme une destination de navigation.
- [ ] L'indicateur de sauvegarde nomme le dernier critère touché, se rafraîchit sans
      rechargement, et se tient en pied de colonne.
