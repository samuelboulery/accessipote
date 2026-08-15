---
{
  "id": "T-0015",
  "titre": "Accueil en deux colonnes",
  "colonne": "en-cours",
  "priorite": "moyenne",
  "tags": [
    "recette",
    "design",
    "charge:s"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-accueil-sortir-le-titre-de-son-coin.md"
}
---

## Contexte

L'accueil restructuré au tour précédent en « accroche en haut, bloc en bas » se retourne
contre lui-même sur écran large : le titre flotte seul dans le coin supérieur gauche, le
centre est creux, et avec un seul audit le bloc du bas ne pèse rien.

Trois causes cumulées : `justify-between` qui creuse le milieu au lieu de l'occuper, un
titre à 32px dans un panneau d'environ 1650px, et rien qui fasse face au titre pour le
tenir.

Au premier lancement, quand aucun audit n'existe, l'écran est encore plus creux — au
moment précis où l'utilisateur aurait le plus besoin d'être guidé.

## Critères d'acceptation

- [ ] Accroche à gauche, audits et actions à droite ; les colonnes s'empilent sous `lg`.
- [ ] Le titre passe au pas `display` et ne flotte plus seul : la colonne de droite lui
      fait face.
- [ ] Une ligne de chiffres donne le poids du référentiel (critères, thèmes, définitions),
      dérivée des données réelles et non écrite en dur.
- [ ] Sans aucun audit, une invitation en pointillés remplace la liste, dit ce qu'est un
      audit et porte l'action de création.
- [ ] L'invitation disparaît dès qu'un audit existe.
- [ ] Aucune cible interactive ne passe sous 44×44.
