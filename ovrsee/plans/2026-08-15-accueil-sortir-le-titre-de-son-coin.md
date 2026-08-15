---
{
  "status": "open",
  "title": "Accueil : sortir le titre de son coin",
  "opened": "2026-08-15",
  "closed": null,
  "commits": [
    {
      "sha": "e99bcfe",
      "date": "2026-08-15",
      "files": [
        "src/App.tsx",
        "src/components/HomeScreen.test.tsx",
        "src/components/HomeScreen.tsx"
      ]
    },
    {
      "sha": "b9c14fc",
      "date": "2026-08-15",
      "files": [
        "src/components/HomeScreen.test.tsx",
        "src/components/HomeScreen.tsx",
        "tailwind.config.js"
      ]
    },
    {
      "sha": "b1d5608",
      "date": "2026-08-15",
      "files": [
        "src/App.tsx",
        "src/components/HomeScreen.test.tsx",
        "src/components/HomeScreen.tsx"
      ]
    },
    {
      "sha": "bffef34",
      "date": "2026-08-15",
      "files": [
        "src/App.tsx",
        "src/components/HomeHero.test.tsx",
        "src/components/HomeHero.tsx",
        "src/components/HomeScreen.test.tsx",
        "src/components/HomeScreen.tsx"
      ]
    }
  ]
}
---

# Accueil : sortir le titre de son coin

## Contexte

L'accueil a été restructuré au tour précédent en « accroche en haut, bloc en bas ». Sur un
écran large le résultat se retourne contre lui : le titre flotte seul dans le coin
supérieur gauche, un grand vide occupe tout le centre, et avec un seul audit le bloc du
bas ne pèse rien. L'utilisateur y voit un manque de hiérarchie, et il a raison — le titre
est à 32px dans un panneau d'environ 1650px.

Trois causes cumulées :
- `justify-between` sur toute la hauteur, qui **creuse** le milieu au lieu de l'occuper ;
- un titre au pas `screen` (32px) là où l'espace en appelle un plus grand ;
- rien qui fasse face au titre, donc rien qui le tienne.

Deux décisions tranchées avec l'utilisateur :
- **mise en page en deux colonnes** — accroche à gauche, audits et actions à droite ;
- **état vide explicite** — une invitation en pointillés remplace la liste absente.

## Ce que ça change

### Mise en page

`HomeScreen.tsx` passe d'une colonne en `justify-between` à une grille de deux colonnes.

- **Colonne gauche** — sur-titre `RGAA 4.1`, titre au pas `display` (42px) au lieu de
  `screen`, accroche, puis une ligne de chiffres en mono qui donne le poids du référentiel
  (`106 critères · 13 thèmes · 119 définitions`). Ces trois nombres existent déjà côté
  `App.tsx` : `criteriaList.length`, `themes.length` et `glossary.length` — le composant
  reçoit déjà les deux premiers, il faut lui passer le nombre de thèmes.
- **Colonne droite** — sur-titre « Tes audits », la liste, le bouton primaire, puis la
  carte Glossaire.

Le vide disparaît parce que la largeur est occupée, pas parce qu'on l'a bourrée.

**Repli en une colonne sous `lg`** : les deux colonnes s'empilent, gauche puis droite.
C'est le seul point de rupture nécessaire — en tactile la mise en page redevient celle
d'aujourd'hui, qui convenait.

Le titre garde `[text-wrap:balance]`, utile à 42px sur une colonne étroite.

### État vide

Quand `audits` est vide, la colonne droite montre un bloc `border-dashed` — la même
affordance que le bouton « Ajouter une page » de `CriteriaDetail.tsx` — qui dit ce qu'est
un audit et porte l'action. Aujourd'hui la liste disparaît simplement et l'écran se creuse
encore plus au premier lancement, précisément quand l'utilisateur a le plus besoin d'être
guidé.

Le composant `EmptyState.tsx` existe mais ne convient pas ici : il est centré, iconique et
conçu pour un résultat de recherche vide. L'invitation d'accueil est un bloc de contenu
avec une action primaire, pas un constat d'absence.

## Fichiers touchés

**Modifiés** : `src/components/HomeScreen.tsx` (l'essentiel), `src/App.tsx` (passer
`themeCount`), `src/components/HomeScreen.test.tsx`.

**Inchangés** : tout le reste. Aucune logique métier n'entre dans ce lot — c'est une
refonte de mise en page et de copie.

## Vérification

1. `pnpm lint && pnpm build && pnpm test:run` verts, couverture ≥ 80 %.
2. Tests à ajouter dans `HomeScreen.test.tsx` : la ligne de chiffres affiche les trois
   comptes ; l'invitation apparaît quand la liste est vide et disparaît dès qu'un audit
   existe ; l'action primaire de l'invitation appelle bien `onCreateAudit`.
3. Navigateur, en clair **et** en sombre, sur l'écran large actuel : le titre ne flotte
   plus seul, le centre n'est plus creux.
4. Vider `localStorage['rgaa-audits']` pour voir l'état vide réel.
5. Rejouer le contrôle DOM des cibles à 44×44 utilisé aux tours précédents — la colonne
   droite gagne des contrôles.
6. Vérifier le repli sous `lg` en réduisant la fenêtre, sachant qu'elle ne descend pas
   sous ~640px dans cet environnement : le point de rupture `lg` (1024px) est lui
   observable, contrairement aux points tactiles.

## Hors périmètre

Pas de nouvelle dépendance, pas de changement aux données RGAA, aux calculs ni aux
exports. Les autres écrans ne bougent pas.
