---
{
  "status": "open",
  "title": "Retours de recette sur la refonte Accessipote",
  "opened": "2026-08-15",
  "closed": null,
  "commits": []
}
---

# Retours de recette sur la refonte Accessipote

## Contexte

La refonte du handoff est livrée (11 commits sur `feature/redesign-hifi`, 564 tests verts).
Première relecture visuelle de l'utilisateur : dix retours, dont trois défauts
fonctionnels réels (sélection groupée incomplète, sélecteur d'audit qui ne fait pas ce
qu'il annonce, bascule sombre confinée à un seul écran) et sept ajustements de design.

Deux décisions ont été tranchées avec l'utilisateur :
- **échelle de rayons ramenée à 3 valeurs** (12 · 24 · pill) ;
- **accueil restructuré** : accroche en haut, bloc audits poussé en bas.

Le handoff (`~/Downloads/design_handoff_accessipote_redesign/README.md`) reste la
référence pour tout ce que ces retours ne contredisent pas. Là où ils le contredisent,
**les retours priment** — c'est le cas de l'échelle de rayons, que le handoff fixait à six
valeurs.

## Ce que l'inventaire a montré

Sur 59 éléments arrondis : `ctrl` 12px (34 usages), `card` 24px (13), `pill` (6) portent
déjà presque tout. `box` 8px (2), `panel` 40px (1) et `frame` 48px (2) sont des cas
isolés — les supprimer touche 5 endroits.

Deux classes mortes traînent, héritées de la phase 1 : `rounded-lg` et `shadow-lg` dans
`ErrorBoundary.tsx:46`. Elles ne produisent aucun style depuis que l'échelle Tailwind par
défaut a été remplacée.

## Les dix retours et leur traitement

### 1 · Échelle de rayons ramenée à trois valeurs

`tailwind.config.js` et `src/tokens.css` : ne gardent que `ctrl` (12), `card` (24),
`pill` (999). `box`, `panel` et `frame` sont supprimés.

Reprises : `rounded-box` → `rounded-ctrl` (`CriteriaItem`, `CriteriaDetail`) ;
`rounded-panel` → `rounded-card` (`KeyboardShortcutsModal`, et `rounded-l-panel` du
panneau principal dans `App.tsx`) ; `rounded-frame` → `rounded-card` (`HomeScreen`,
`NewAuditForm`, `BulkActions`). `ErrorBoundary` passe de `rounded-lg`/`shadow-lg` (morts)
à `rounded-card`/`shadow-panel`.

### 2 · Padding proportionné au rayon

Règle appliquée partout : **padding ≥ rayon du parent − rayon de l'enfant**. À égalité
l'enfant épouse exactement la courbe ; au-dessus il respire. En dessous, il mord le coin —
c'est le défaut signalé.

Concrètement : conteneur de premier niveau (24) → `p-6` ; carte contenant des contrôles
(24 → 12) → `p-4` plutôt que `p-3`, pour l'espace continu demandé.

Exception assumée : `StatusPill` et les pastilles de thème gardent `py-1`. Un rayon `pill`
vaut la moitié de la hauteur, il épouse le texte par construction — la règle ne s'y
applique pas.

### 3 · Tout sélectionner / tout désélectionner

Une case maîtresse dans l'en-tête de thème (`AuditScreen.tsx`), à l'état **indéterminé**
quand la sélection est partielle (propriété DOM `indeterminate`, posée par `ref` — ce
n'est pas un attribut). Elle agit sur `filteredCriteria`, c'est-à-dire exactement ce que
l'utilisateur voit : c'est ce qui rendait l'ancien « tout sélectionner » malhonnête.

`BulkActions` garde « Tout désélectionner ».

### 4 · Barre d'actions groupées moins arrondie

Traité par le point 1 : `rounded-frame` (48) → `rounded-card` (24). À 48px sur une barre
basse, les extrémités lisaient comme une pastille.

### 5 · Bascule clair/sombre dans la barre latérale

Elle quitte la barre d'outils de l'écran Audit (`App.tsx`, prop `toolbarActions`) pour le
**pied de la barre latérale**, à côté de l'indicateur de sauvegarde.

En tactile la barre latérale n'existe pas : la bascule rejoint `MobileTabBar`, en bouton
d'icône **hors du `<nav>`** et séparé des quatre onglets — ce n'est pas une destination et
elle ne doit pas être annoncée comme telle.

### 6 · Sélecteur d'audit fonctionnel

Aujourd'hui `onAuditSelectorClick={() => setView('home')}` : le bouton annonce un
sélecteur et fait une navigation. Nouveau composant `src/components/AuditSwitcher.tsx` —
le bouton existant ouvre un popover listant les audits (nom, mode, ratio), l'actif marqué
`aria-current`, plus deux actions : « Voir tous les audits » et « Nouvel audit ».

Fermeture par Échap et clic extérieur, comme le popover de `SearchFilters.tsx` dont la
mécanique se réutilise telle quelle. Câblé sur `setActiveAuditId` de `useAudits`.

### 7 · Indicateur de sauvegarde : dynamique, et tout en bas

Trois défauts : il ne dit pas ce qui a changé, il ne se rafraîchit pas, et il flotte sous
la carte d'audit au lieu d'être en pied de colonne.

- `Audit` gagne un champ optionnel `lastTouchedCriteriaId?: string`, renseigné par les
  mutations de `App.tsx` (statut, note, pages, tests cochés). Champ optionnel : aucune
  migration, les audits existants le laissent indéfini.
- Le libellé devient « Enregistré il y a 2 min · critère 1.2 », et retombe sur la forme
  courte quand rien n'a encore été touché.
- Rafraîchissement : un `setInterval` de 30 s dans `Sidebar` force le recalcul de
  `formatRelativeTime`, sinon « il y a 2 min » se fige.
- Position : `mt-auto` sur le pied de la barre latérale.

### 8 · Accueil restructuré

`HomeScreen.tsx`, en `flex-col justify-between` sur toute la hauteur :

- **Haut** : sur-titre `RGAA 4.1`, titre « Auditer l'accessibilité sans perdre le fil. »,
  accroche courte disant ce que fait l'outil et que tout reste dans le navigateur.
- **Bas** : sur-titre « Vos audits », la liste, puis les actions.

Le texte d'accroche est une proposition, facile à reprendre.

### 9 · Bouton d'accueil à la largeur de son contenu

« Démarrer un nouvel audit » perd `w-full` : `self-start` sur desktop, dans une rangée
avec « Glossaire ». Il reprend la pleine largeur en tactile, où c'était correct.

### 10 · Logo retiré de l'accueil

La tuile de logo et le mot-symbole disparaissent de `HomeScreen` — la barre latérale les
porte déjà. Le marqueur `RGAA 4.1` est conservé, en sur-titre de l'accroche.

## Fichiers touchés

**Nouveau** : `src/components/AuditSwitcher.tsx` (+ test).

**Modifiés** : `tailwind.config.js`, `src/tokens.css`, `src/App.tsx`,
`src/components/Sidebar.tsx`, `HomeScreen.tsx`, `BulkActions.tsx`, `AuditScreen.tsx`,
`MobileTabBar.tsx`, `NewAuditForm.tsx`, `KeyboardShortcutsModal.tsx`, `ErrorBoundary.tsx`,
`CriteriaItem.tsx`, `CriteriaDetail.tsx`, `src/types/index.ts`.

**Tests à reprendre** : `HomeScreen.test.tsx` (le mot-symbole disparaît, la mise en page
change), `Sidebar.test.tsx` (bascule sombre, indicateur enrichi),
`AuditScreen.test.tsx` (case maîtresse), `MobileTabBar.test.tsx` (bascule ajoutée).

**Invariants inchangés** : `calculateSummaryStats`, `exportMarkdown`, `transformCriteria`,
`useProgress`, `parseGlossaryHtml`, les JSON RGAA, la CSP et `devCspPlugin`.

## Vérification

1. `pnpm lint && pnpm build && pnpm test:run` verts, couverture ≥ 80 % (seuils CI à 80/85/90/80).
2. Contrôle par le DOM qu'aucune classe `rounded-box|panel|frame|lg` ne subsiste.
3. Navigateur, en clair **et** en sombre : accueil (accroche en haut, bloc en bas, bouton
   à sa largeur, pas de logo), sélecteur d'audit qui bascule réellement d'audit, case
   maîtresse dont l'état indéterminé suit une sélection partielle, barre d'actions
   groupées à 24px, bascule sombre en pied de barre latérale, indicateur de sauvegarde
   nommant le dernier critère touché et se rafraîchissant.
4. Vérifier qu'aucune cible interactive ne repasse sous 44×44 (le contrôle DOM utilisé en
   phase 9 est rejouable).
5. Contrôle visuel des coins : sur chaque conteneur arrondi, le premier enfant ne doit pas
   mordre la courbe.

## Hors périmètre

Pas de nouvelle dépendance. Pas de changement aux données RGAA, aux calculs ni aux
exports. Le rendu tactile reste vérifié par le code et les tests, pas visuellement — la
fenêtre du navigateur ne descend pas sous ~640 px dans cet environnement.
