---
{
  "status": "open",
  "title": "Responsive + états vides « aperçu grisé »",
  "opened": "2026-08-15",
  "closed": null,
  "commits": []
}
---

# Responsive + états vides « aperçu grisé »

## Contexte

Accessipote sort d'une refonte visuelle (branche `feature/redesign-hifi`, mergée) où le
responsive n'a jamais été traité de front : 12 classes de breakpoint en tout, sur 7 fichiers.
Deux besoins distincts, exprimés par l'utilisateur.

**1. Le responsive casse aux trois échelles** (téléphone, tablette/petit laptop, grand écran).
La cause principale est structurelle : les breakpoints Tailwind sont des breakpoints
**viewport**, alors que la zone de contenu réelle vaut `viewport − 244px (sidebar) − 48px
(padding du main)`. À 1024px — là où `lg:` déclenche les mises en page deux colonnes — le
contenu utile ne fait que **732px**. Chaque split se déclenche donc ~290px trop tôt :
`CriteriaDetail` se retrouve avec une colonne principale de 350px face à un panneau de 380px.

**2. Les états vides sont nus.** Sans audit ouvert, les vues Audit et Synthèse n'affichent
qu'un `<p>` gris codé en dur dans `App.tsx`. L'utilisateur veut un **aperçu grisé du vrai
écran** : le squelette de l'interface en filigrane, message et appel à l'action par-dessus.

Résultat visé : une app utilisable de 320px à 1600px, et des écrans vides qui montrent ce qui
va apparaître au lieu de constater un manque.

---

## Partie 1 — Responsive

### 1.1 Un seuil nommé plutôt que des breakpoints viewport

`tailwind.config.js` ne déclare pas de clé `screens` : l'app hérite des seuils Tailwind par
défaut. On déclare `screens` explicitement, dans le même esprit que le reste du fichier (les
échelles y sont **remplacées**, pas étendues, pour qu'une classe hors système ne produise
aucun style et rende la dérive visible) :

```js
// tailwind.config.js — dans `theme`, à côté de `colors`, `spacing`…
//
// Les breakpoints sont viewport, la zone de contenu vaut `viewport − 244 (sidebar)
// − 48 (padding du main)`. `wide` est le seuil à partir duquel le contenu dépasse
// 800px : c'est lui, pas la fenêtre, qui décide des mises en page deux colonnes.
screens: {
  sm:   '640px',   // bascule mobile — aligné sur useIsMobile (max-width: 639px)
  wide: '1100px',  // contenu ≈ 808px
  xl:   '1280px',  // contenu ≈ 988px
},
```

`lg` disparaît volontairement. Les 6 classes `lg:` existantes cesseraient de produire du
style — elles sont toutes réécrites ci-dessous, et l'absence de `lg` empêche d'en réintroduire
par réflexe.

### 1.2 Remplacement des splits `lg:` → `wide:`

Même transformation partout : le seuil passe de 1024 à 1100px.

| Fichier | Ligne | Avant | Après |
|---|---|---|---|
| `src/components/CriteriaDetail.tsx` | 123 | `lg:grid-cols-[1fr_380px]` | `wide:grid-cols-[1fr_380px]` |
| `src/components/GlossaryScreen.tsx` | 114 | `lg:flex-row` | `wide:flex-row` |
| `src/components/GlossaryScreen.tsx` | 115 | `lg:w-[320px] lg:border-r lg:border-separator lg:pr-4` | `wide:w-[320px] wide:border-r wide:border-separator wide:pr-4` |
| `src/components/SummaryTab.tsx` | 53 | `sm:grid-cols-2 lg:grid-cols-4` | `sm:grid-cols-2 wide:grid-cols-4` |
| `src/components/HomeHero.tsx` | 26 | `lg:flex-row lg:items-center lg:justify-between lg:gap-14` | `wide:flex-row wide:items-center wide:justify-between wide:gap-14` |
| `src/components/HomeHero.tsx` | 43 | `lg:flex-col lg:gap-6` | `wide:flex-col wide:gap-6` |

`HomeScreen.tsx:51` (`xl:grid-cols-2`) reste en `xl` : deux cartes d'audit côte à côte ont
besoin de plus d'air que le seuil `wide`.

### 1.3 Téléphone (< 640px)

- **`HomeHero.tsx:31`** — `text-hero` (3,5 rem) sans variante : titre démesuré sous 640px.
  → `text-screen sm:text-display wide:text-hero`. Idem ligne 46, `text-display` → `text-section sm:text-display`.
- **`AuditScreen.tsx:139`** — `flex items-center gap-3` (recherche + filtres + export) sans
  `flex-wrap` → déborde. Ajouter `flex-wrap`.
- **`MobileTabBar.tsx:24`** — pas de zone sûre iOS : la barre passe sous l'indicateur d'accueil.
  Ajouter `pb-[max(8px,env(safe-area-inset-bottom))]` (et retirer le `p-2` au profit de
  `px-2 pt-2`).
- **`BulkActions.tsx:33`** — `sticky bottom-4` : la barre d'actions groupées se glisse **sous**
  la `MobileTabBar` (fixe, 64px). → `bottom-two sm:bottom-4` (`two` = 64px, jeton existant).
- **`SearchFilters.tsx:94`** — popover `absolute right-0 w-[280px]` : ajouter
  `max-w-[calc(100vw-32px)]`.
- **`GlossaryPopover.tsx:49`** — bug de bornage réel :
  `Math.min(Math.max(8, anchor.left), window.innerWidth - WIDTH - 8)` devient **négatif** sous
  336px de large, le popover sort de l'écran à gauche. Corriger en bornant à l'extérieur et en
  rendant la largeur adaptative :
  ```ts
  const width = Math.min(WIDTH, window.innerWidth - 16);
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8));
  ```
- **`GlossaryScreen.tsx:137,164`** — deux zones `overflow-y-auto` imbriquées dans un `<main>`
  déjà scrollable : en colonne (mobile) ça produit un double défilement. Ne les rendre
  scrollables qu'au-delà du seuil : `min-h-0 flex-1` → `wide:min-h-0 wide:flex-1
  wide:overflow-y-auto` (le `<main>` scrolle seul en dessous).
- **`ThemeSummaryTable.tsx:24`** — le tableau garde son défilement horizontal (13 lignes × 7
  colonnes empilées en cartes serait pire), mais le conteneur `overflow-x-auto` n'est pas
  atteignable au clavier — **WCAG 2.1.1**. Ajouter `tabIndex={0}`, `role="region"` et
  `aria-label="Répartition par thème, tableau défilant horizontalement"`.

### 1.4 Grand écran (> 1400px)

Rien ne borne la largeur de lecture : le tableau et les paragraphes s'étirent indéfiniment.

La contrainte à respecter : `HomeHero` est **hors** du `<main>` (`App.tsx:279`) et les deux
blocs doivent rester alignés — c'est l'objet du commentaire `HomeHero.tsx:24-25`. On ne pose
donc pas la largeur max sur le panneau lui-même (qui doit rester à fleur du bord droit,
`rounded-l-card`), mais sur un **conteneur interne identique dans les deux**, tous deux ayant
déjà `p-6` :

```
mx-auto w-full max-w-[1200px]
```

- `App.tsx:286-291` — envelopper le contenu du `<main>` dans
  `<div className="mx-auto flex w-full min-h-0 max-w-[1200px] flex-1 flex-col">`.
  Les `min-h-0 flex-1 flex-col` sont indispensables : `GlossaryScreen` en dépend pour sa
  hauteur.
- `HomeHero.tsx:26` — même wrapper autour des deux enfants du `<header>` (le bloc de texte et
  la liste des chiffres), le `<header>` gardant son fond pleine largeur.

---

## Partie 2 — États vides « aperçu grisé »

### 2.1 Ce qui existe déjà et qu'on réutilise

- **`src/components/EmptyState.tsx`** (24 lignes) — `{title, body, Icon?, actions?}`. Déjà
  utilisé par `AuditScreen:246`, `CriteriaList:39`, `GlossaryScreen:200` pour les « aucun
  résultat ». On l'**étend** d'une prop plutôt que de créer un composant parallèle.
- **`AuditRing`** avec `segments={[]}` rend déjà l'anneau de piste seul (`--a-track`) :
  l'anneau vide du squelette ne demande aucun code.
- **`SegmentedGauge`** avec `total={0}` rend de même la piste seule.
- Jetons gris disponibles en clair **et** en sombre : `bg-sunk`, `bg-track`, `border-dashed`
  (`tokens.css:15-16` / `89-90`). Aucune couleur nouvelle nécessaire.
- `prefers-reduced-motion` est déjà neutralisé globalement (`tokens.css:129`) — le squelette
  reste statique de toute façon, pas d'animation de pulsation.

### 2.2 Modifications

**`src/components/EmptyState.tsx`** — ajouter une prop optionnelle :

```tsx
/** Squelette décoratif de l'écran à venir. Toujours enveloppé en aria-hidden :
 *  il illustre, il n'informe pas — le message reste la seule source. */
preview?: React.ReactNode;
```

rendue au-dessus de la pastille d'icône, dans `<div aria-hidden="true" className="w-full max-w-[420px] select-none">`.
Le `aria-hidden` est porté par `EmptyState`, pas par l'appelant : impossible de l'oublier.

**`src/components/NoAuditState.tsx`** (nouveau, ~90 lignes) — porte les deux squelettes et le
texte. Un seul fichier, testable isolément, et `App.tsx` ne grossit pas.

```tsx
interface NoAuditStateProps {
  target: 'audit' | 'summary';
  /** Des audits existent-ils ? Décide du texte et de l'action. */
  hasAudits: boolean;
  onGoHome: () => void;
  onCreateAudit: () => void;
}
```

Squelettes (purement présentationnels, jetons existants) :

- `target="audit"` — une rangée de 4 pastilles `h-ctrl rounded-pill bg-track` de largeurs
  décroissantes (le `ThemeRail`), puis 3 cartes `h-14 rounded-card border-1 border-dashed
  bg-sunk` (les critères).
- `target="summary"` — un `AuditRing size={128} segments={[]}` à gauche, 3 barres
  `SegmentedGauge total={0}` à droite, puis 3 lignes de tableau fantômes
  (`h-8 rounded-ctrl bg-sunk`).

Textes (français, tutoiement, cohérent avec le reste) :

| Cas | Titre | Corps | Action |
|---|---|---|---|
| `audit`, aucun audit | « Rien à évaluer pour l'instant » | « Un audit, c'est les 106 critères à statuer, thème par thème. Crées-en un et cet écran se remplira au fil de tes réponses. » | **Démarrer un premier audit** → `onCreateAudit` |
| `audit`, des audits existent | « Aucun audit ouvert » | « Tes audits sont sur l'accueil. Reprends celui que tu veux, tu retrouveras tes statuts, tes notes et tes pages. » | **Choisir un audit** → `onGoHome` |
| `summary`, aucun audit | « Pas encore de synthèse » | « La synthèse calcule ton taux de conformité à partir des critères tranchés. Elle apparaîtra dès que tu auras démarré un audit. » | **Démarrer un premier audit** → `onCreateAudit` |
| `summary`, des audits existent | « Aucun audit ouvert » | « Ouvre un audit depuis l'accueil pour voir sa synthèse : taux de conformité, répartition et détail par thème. » | **Choisir un audit** → `onGoHome` |

Distinguer les deux cas via `homeAudits.length > 0` : proposer « choisir un audit » à
quelqu'un qui n'en a aucun est une impasse, et proposer « en créer un » à qui en a douze
ignore son travail.

**`src/App.tsx:334-337` et `348-351`** — remplacer les deux `<p>` par :

```tsx
<NoAuditState
  target="audit"                          /* puis "summary" */
  hasAudits={homeAudits.length > 0}
  onGoHome={() => setView('home')}
  onCreateAudit={() => { setView('home'); setIsCreating(true); }}
/>
```

**`src/components/SummaryTab.tsx`** — cas « audit ouvert, 0 critère évalué » : aujourd'hui
tout s'affiche à zéro, taux `–`, tableau de zéros. Sous le `<h1>Synthèse</h1>`, si
`view.evaluated === 0`, remplacer le corps par un `EmptyState` portant le squelette summary :
titre « Aucun critère évalué », corps « Les chiffres arrivent dès le premier statut posé.
Ouvre l'onglet Audit et commence par le thème que tu veux. » Le bouton d'export est masqué
dans ce cas — exporter un audit vide n'a pas de sens.

**`src/components/HomeScreen.tsx:132-149`** — l'invitation existante (carte pointillée + CTA)
est déjà correcte ; on lui ajoute le squelette `audit` pour homogénéiser les trois écrans.

### 2.3 Accessibilité

- Squelettes strictement décoratifs → `aria-hidden="true"` porté par `EmptyState`.
- `EmptyState` rend déjà un `<h2>` : dans `SummaryTab` il se place sous le `<h1>`, la hiérarchie
  de titres reste correcte.
- Les CTA sont de vrais `<button>` à `h-prim` (48px), pas des liens décorés.
- Aucun `style={{}}` arbitraire : largeurs de pastilles via classes utilitaires (`w-chip`,
  `w-two`…), pas de valeur calculée en ligne.

---

## Partie 3 — Tests

TDD : test d'abord, comme le veut `.claude/rules/testing.md`.

| Fichier | Action | Cas |
|---|---|---|
| `src/components/NoAuditState.test.tsx` | **créer** | 4 combinaisons `target` × `hasAudits` : titre attendu, libellé du bouton, handler appelé. Squelette absent de l'arbre accessible (`getByRole` ne le voit pas). |
| `src/components/EmptyState.test.tsx` | **créer** | `preview` rendu dans un conteneur `aria-hidden` ; absent si la prop est omise. |
| `src/components/SummaryTab.test.tsx` | modifier | `evaluated === 0` → état vide + export masqué ; `evaluated > 0` → grille et tableau rendus (non-régression). |
| `src/components/ThemeSummaryTable.test.tsx` | **créer** | conteneur scrollable focalisable (`tabIndex=0`, `role="region"`, `aria-label`). |
| `src/components/GlossaryPopover.test.tsx` | modifier | `innerWidth = 320` → `left >= 8` et largeur ≤ `innerWidth − 16`. |
| `src/components/HomeScreen.test.tsx` | modifier | l'invitation porte le squelette ; le test existant (ligne 75-81) reste vert. |

Les classes responsive ne se testent pas sous jsdom (pas de layout) — elles relèvent de la
vérification visuelle ci-dessous. `src/test/setup.ts` mocke déjà `matchMedia`, aucun réglage
supplémentaire.

---

## Ordre d'exécution

1. `tailwind.config.js` : clé `screens`. `pnpm build` doit passer.
2. Réécrire les 6 classes `lg:` en `wide:` (§1.2). Rien ne doit plus contenir `lg:`.
3. Correctifs téléphone (§1.3), y compris le bug de bornage `GlossaryPopover` et le
   `tabIndex` du tableau — avec leurs tests.
4. Largeur maximale de lecture (§1.4), en vérifiant que le glossaire garde sa hauteur.
5. `EmptyState` : prop `preview` + test.
6. `NoAuditState` : test d'abord, puis composant, puis branchement dans `App.tsx`.
7. Cas « 0 critère évalué » de `SummaryTab`, puis squelette de `HomeScreen`.
8. `pnpm lint && pnpm build && pnpm test:run`.

## Vérification

```bash
pnpm lint && pnpm build && pnpm test:run   # zéro erreur, 564+ tests verts
pnpm dev                                    # http://localhost:5173
```

Passer chaque largeur en émulation d'appareil, sur les quatre vues, en clair **et** en sombre :

| Largeur | Ce qu'on vérifie |
|---|---|
| 320px | Rien ne déborde horizontalement. Popover glossaire visible en entier. Titre d'accueil lisible. Barre d'onglets non masquée par l'indicateur iOS. |
| 375px | Barre d'outils de l'audit passe à la ligne. Actions groupées au-dessus de la barre d'onglets, pas dessous. |
| 640px | Bascule sidebar / barre d'onglets sans saut de mise en page. Cartes de synthèse sur 2 colonnes. |
| 900px | Sidebar + contenu : détail de critère et glossaire restent en **une** colonne (c'est le bug corrigé). |
| 1100px | Passage propre à deux colonnes : détail de critère, glossaire, 4 cartes de synthèse. |
| 1280px | Liste des audits sur 2 colonnes. |
| 1600px | Contenu borné à 1200px et centré ; bannière d'accueil et panneau toujours alignés à gauche. |

Au clavier : `Tab` doit atteindre le tableau de synthèse et permettre son défilement
horizontal aux flèches ; les CTA des états vides doivent être atteignables et déclencher la
bonne navigation.
