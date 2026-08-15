---
{
  "status": "open",
  "title": "Recette responsive — seconde passe",
  "opened": "2026-08-15",
  "closed": null,
  "commits": [
    {
      "sha": "2c647de",
      "date": "2026-08-16",
      "files": [
        "index.html",
        "src/App.tsx",
        "src/components/AuditScreen.tsx",
        "src/components/BulkActions.tsx",
        "src/components/CriteriaDetail.tsx",
        "src/components/EmptyState.test.tsx",
        "src/components/GlossaryPopover.test.tsx",
        "src/components/GlossaryPopover.tsx",
        "src/components/GlossaryScreen.tsx",
        "src/components/HomeHero.test.tsx",
        "src/components/HomeHero.tsx",
        "src/components/HomeScreen.tsx",
        "src/components/MobileTabBar.test.tsx",
        "src/components/MobileTabBar.tsx",
        "src/components/MobileTopBar.test.tsx",
        "src/components/MobileTopBar.tsx",
        "src/components/NoAuditState.test.tsx",
        "src/components/NoAuditState.tsx",
        "src/components/SearchFilters.tsx",
        "src/components/SummaryTab.test.tsx",
        "src/components/SummaryTab.tsx",
        "src/components/ThemeSummaryTable.test.tsx",
        "src/components/ThemeSummaryTable.tsx",
        "src/index.css",
        "tailwind.config.js"
      ]
    }
  ]
}
---

# Recette responsive — seconde passe

## Contexte

La première passe (seuil `wide`, correctifs téléphone, largeur de lecture, états vides) est
livrée. La recette visuelle sur appareil réel remonte quatre défauts, dont trois propres au
mobile. Ils partagent une cause : **la sidebar disparaît sous 640px, et rien n'a repris ce
qu'elle portait** — ni l'identité de l'app, ni le sélecteur de thème, ni la place qu'elle
prenait dans le calcul des seuils.

1. **Les chiffres de la bannière tombent sous le texte sur desktop.** Le seuil de bascule est
   un breakpoint *fenêtre* (`roomy`, 1024px) alors que la bannière vit à droite d'une sidebar
   de 244px. Le calcul « fenêtre − 292px » est juste en théorie mais impossible à caler à
   l'œil : la valeur retenue rate les fenêtres autour de 1000px. La bannière doit décider
   d'après **sa propre largeur**.
2. **La bannière n'est pas bord à bord en mobile** : elle garde la marge et l'arrondi gauche
   pensés pour le panneau desktop.
3. **On ne peut pas descendre assez bas** : la bannière est figée hors de la zone qui défile
   et mange plus de la moitié de l'écran, et le padding bas (64px) vaut exactement la hauteur
   de la barre d'onglets — le dernier bouton passe dessous.
4. **Le sélecteur de thème encombre la barre d'onglets**, qui doit ne porter que les quatre
   destinations.

Décisions prises avec l'utilisateur : une **barre supérieure mobile** (logo + thème) reprend
ce que la sidebar portait, et la **bannière défile avec le contenu**.

---

## 1. Bannière : décider d'après sa largeur, pas celle de la fenêtre

Une *container query* remplace le breakpoint. La bannière est le seul bloc dont la largeur
utile change de nature entre mobile (pleine largeur) et desktop (fenêtre − 244px) : c'est
exactement ce qu'un breakpoint viewport ne sait pas exprimer. CSS natif, aucune dépendance —
`@container` est disponible dans tous les navigateurs cibles depuis 2023.

**`src/index.css`**, à la suite des règles `.banner` existantes :

```css
/* La bannière décide de sa mise en page d'après SA largeur : elle occupe toute
   la fenêtre en mobile et la fenêtre moins 244px de sidebar en desktop. Un
   breakpoint viewport confond les deux, et le seuil calé sur l'un rate l'autre. */
.hero { container-type: inline-size; }

/* 620px : ce qu'il faut pour poser le bloc de texte et la colonne de chiffres
   côte à côte sans les écraser. */
@container (min-width: 620px) {
  .hero-layout {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 56px;   /* jeton `14` */
  }
  .hero-figures { flex-direction: column; gap: 24px; }  /* jeton `6` */
}
```

**`src/components/HomeHero.tsx`** :
- `<header>` : ajouter `hero`, et rendre la marge et l'arrondi conditionnels —
  `mt-2 rounded-l-card` devient `sm:mt-2 sm:rounded-l-card` (point 2 : bord à bord en mobile).
- Conteneur interne : `roomy:flex-row roomy:items-center roomy:justify-between roomy:gap-14`
  → `hero-layout`.
- Liste des chiffres : `roomy:flex-col roomy:gap-6` → `hero-figures`.
- Le titre garde `roomy:text-hero` : à 1024px de fenêtre le conteneur fait déjà 732px, de quoi
  loger le pas `hero` (≈530px) et la colonne de chiffres. Le seuil `roomy` reste dans
  `tailwind.config.js` pour ce seul usage.

---

## 2. Barre supérieure mobile

**`src/components/MobileTopBar.tsx`** (nouveau, ~30 lignes) — logo + nom + sélecteur, en
`sticky top-0 z-20` dans la zone qui défile. `sticky` plutôt que `fixed` : il occupe sa place,
donc rien à compenser en padding.

```tsx
interface MobileTopBarProps {
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}
```

Reprend `AccessipoteLogo` (`size={16}` dans la pastille `bg-ink text-surface`, comme
`Sidebar.tsx:76-79`) et `DarkModeToggle` tel quel. Hauteur `h-touch`, fond `bg-bg` pour se
fondre avec le fond de l'app, `pt-[env(safe-area-inset-top)]` pour l'encoche.

**`src/components/MobileTabBar.tsx`** : retirer `DarkModeToggle` et les props `themeMode` /
`onCycleTheme`. Le `<nav>` devient l'unique enfant — le `flex items-center gap-2` du conteneur
et le `flex-1` du `<nav>` n'ont plus lieu d'être.

**`index.html:6`** : `viewport-fit=cover` manque dans le meta viewport. Sans lui,
`env(safe-area-inset-*)` vaut **0** sur iOS — la zone sûre déjà posée sur la barre d'onglets
ne sert donc à rien aujourd'hui.

---

## 3. Défilement mobile

Aujourd'hui c'est le `<main>` qui défile (`App.tsx:291`), la bannière étant son frère figé
au-dessus (`App.tsx:283`). En mobile on déplace le défilement d'un cran vers le haut, sur le
conteneur qui les contient tous les deux.

**`src/App.tsx`** :
- Conteneur (ligne 282) : `overflow-hidden` → `overflow-y-auto sm:overflow-hidden`.
- `<main>` (ligne 291) : `overflow-y-auto` → `sm:overflow-y-auto`.
- Padding bas mobile : `pb-two` → `pb-[calc(80px+env(safe-area-inset-bottom))]`. La barre
  d'onglets fait 64px plus la zone sûre ; les 16px restants sont l'air qui manquait.
- `<MobileTopBar>` monté sous la même condition `isMobile` que `MobileTabBar`, en premier
  enfant du conteneur.

Le wrapper de largeur de lecture (ligne 301) garde `min-h-0 flex-1 flex-col` : `GlossaryScreen`
en dépend au-delà de `wide`, et en mobile ses panneaux ne défilent plus séparément (déjà réglé
à la passe précédente).

---

## 4. Tests

| Fichier | Action | Cas |
|---|---|---|
| `src/components/MobileTopBar.test.tsx` | **créer** | nom de l'app annoncé ; sélecteur présent et cliquable (`name: /Thème :/`) ; logo décoratif absent de l'arbre accessible |
| `src/components/MobileTabBar.test.tsx` | modifier | plus aucun bouton hors des quatre destinations ; le sélecteur n'y est plus |
| `src/components/HomeHero.test.tsx` | modifier | la bannière porte `hero` et le conteneur `hero-layout` (les 8 cas existants restent verts) |
| `src/components/Sidebar.test.tsx` | inchangé | le sélecteur reste au pied de la sidebar en desktop |

Les container queries ne se testent pas sous jsdom (pas de layout) — vérification visuelle.

---

## Vérification

```bash
pnpm lint && pnpm build && pnpm test:run   # 600+ tests verts
pnpm dev
```

Après le build, confirmer que la règle `@container` est bien émise :
`grep -c "@container" dist/assets/index-*.css` doit renvoyer 1.

Émulation d'appareil, sur les quatre vues, en clair **et** en sombre :

| Largeur | Ce qu'on vérifie |
|---|---|
| 375px | Bannière bord à bord : ni marge, ni arrondi, ni bande de fond au-dessus. Barre supérieure avec logo et sélecteur. Barre d'onglets réduite aux quatre destinations. |
| 375px, défilé à fond | La bannière défile et sort de l'écran ; le bouton « Démarrer un premier audit » est entièrement visible, au-dessus de la barre d'onglets. |
| 640px | Bascule sidebar / barres mobiles sans saut : le sélecteur passe de la barre supérieure au pied de la sidebar. |
| 900px et 1000px | **Le défaut signalé** : chiffres en colonne à droite du texte, pas en dessous. |
| 1400px | Chiffres à droite, titre au pas `hero`, bannière et panneau toujours alignés à gauche. |

Sur iOS (ou en émulation iPhone avec encoche) : ni la barre supérieure sous l'encoche, ni la
barre d'onglets sous l'indicateur d'accueil.

---

## Hors périmètre, signalé

En mobile, la sidebar emportait aussi l'indicateur « Enregistré il y a X »
(`Sidebar.tsx:160-168`) : plus aucun retour de sauvegarde sur téléphone. La barre supérieure
pourrait l'accueillir — à décider séparément, ce n'est pas dans la demande.
