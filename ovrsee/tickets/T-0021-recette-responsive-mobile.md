---
{
  "id": "T-0021",
  "titre": "Recette responsive mobile",
  "colonne": "revue",
  "priorite": "haute",
  "tags": [
    "responsive",
    "mobile",
    "ux"
  ],
  "cree": "2026-08-16",
  "maj": "2026-08-15",
  "plan": "2026-08-15-recette-responsive-seconde-passe.md",
  "epic": "T-0016"
}
---

## Contexte

Recette de la première passe sur appareil réel. Quatre défauts, dont trois partagent une
cause : la sidebar disparaît sous 640px et rien n'a repris ce qu'elle portait — ni l'identité
de l'app, ni le sélecteur de thème, ni la place qu'elle occupait dans le calcul des seuils.

Les chiffres de la bannière retombent sous le texte parce que le seuil de bascule mesure la
fenêtre alors que la bannière vit à droite d'une sidebar de 244px. Le calcul « fenêtre − 292 »
est juste mais impossible à caler à l'œil : la valeur retenue rate les fenêtres autour de
1000px. Une container query lui fait décider d'après sa propre largeur, et clôt le sujet.

En mobile, la bannière garde marge et arrondi pensés pour le panneau desktop, reste figée hors
de la zone qui défile en mangeant plus de la moitié de l'écran, et le padding bas vaut
exactement la hauteur de la barre d'onglets — le dernier bouton passe dessous.

Retenu avec l'utilisateur : une barre supérieure mobile (logo + thème) reprend ce que la
sidebar portait, et la bannière défile avec le contenu.

## Critères d'acceptation

- [ ] Les chiffres de la bannière restent à droite du texte à toute largeur où ils tiennent, quelle que soit la présence de la sidebar
- [ ] En mobile la bannière est bord à bord : ni marge, ni arrondi, ni bande de fond au-dessus
- [ ] La bannière défile avec le contenu en mobile et sort de l'écran
- [ ] Le dernier élément d'un écran reste entièrement visible au-dessus de la barre d'onglets
- [ ] La barre d'onglets ne porte plus que les quatre destinations
- [ ] Une barre supérieure mobile porte le logo, le nom de l'app et le sélecteur de thème
- [ ] `viewport-fit=cover` posé : les zones sûres iOS s'appliquent réellement
- [ ] Tests : `MobileTopBar` créé, `MobileTabBar` sans sélecteur, suite complète verte
