---
{
  "status": "open",
  "title": "Refonte Accessipote — direction retenue (handoff design)",
  "opened": "2026-08-15",
  "closed": null,
  "commits": [
    {
      "sha": "caaa1bc",
      "date": "2026-08-15",
      "files": [
        "ovrsee.config.json",
        "public/fonts/chelsea-market-latin-ext.woff2",
        "public/fonts/chelsea-market-latin.woff2",
        "public/fonts/instrument-sans-var-latin-ext.woff2",
        "public/fonts/instrument-sans-var-latin.woff2",
        "public/fonts/jetbrains-mono-var-latin-ext.woff2",
        "public/fonts/jetbrains-mono-var-latin.woff2",
        "src/index.css",
        "src/tokens.css",
        "tailwind.config.js"
      ]
    },
    {
      "sha": "3377187",
      "date": "2026-08-15",
      "files": [
        ".gitignore",
        "src/constants.ts",
        "src/hooks/useAudits.test.ts",
        "src/hooks/useAudits.ts",
        "src/types/index.ts",
        "src/utils/migrateProgress.test.ts",
        "src/utils/migrateProgress.ts"
      ]
    },
    {
      "sha": "82c129b",
      "date": "2026-08-15",
      "files": [
        "src/components/AccessipoteLogo.tsx",
        "src/components/AuditRing.test.tsx",
        "src/components/AuditRing.tsx",
        "src/components/SegmentedGauge.test.tsx",
        "src/components/SegmentedGauge.tsx",
        "src/components/Sidebar.test.tsx",
        "src/components/Sidebar.tsx",
        "src/components/StatusButtons.test.tsx",
        "src/components/StatusButtons.tsx",
        "src/components/StatusPill.test.tsx",
        "src/components/StatusPill.tsx",
        "src/utils/formatRelativeTime.ts",
        "src/utils/statusPresentation.ts"
      ]
    },
    {
      "sha": "824e796",
      "date": "2026-08-15",
      "files": [
        "package.json",
        "pnpm-lock.yaml",
        "src/App.tsx",
        "src/components/AuditScreen.tsx",
        "src/components/CriteriaDetail.tsx",
        "src/components/CriteriaItem.test.tsx",
        "src/components/CriteriaItem.tsx",
        "src/components/CriteriaList.test.tsx",
        "src/components/CriteriaList.tsx",
        "src/components/EmptyState.tsx",
        "src/components/ExportButton.test.tsx",
        "src/components/ExportButton.tsx",
        "src/components/HomeScreen.tsx",
        "src/components/NewAuditForm.tsx",
        "src/components/SearchFilters.test.tsx",
        "src/components/SearchFilters.tsx",
        "src/components/ThemeRail.tsx",
        "src/hooks/useFilters.test.ts",
        "src/hooks/useFilters.ts",
        "src/index.css",
        "src/types/index.ts"
      ]
    },
    {
      "sha": "390c55b",
      "date": "2026-08-15",
      "files": [
        "src/App.tsx",
        "src/components/DonutChart.test.tsx",
        "src/components/DonutChart.tsx",
        "src/components/GlossaryPopover.tsx",
        "src/components/GlossaryScreen.tsx",
        "src/components/GlossarySidePanel.test.tsx",
        "src/components/GlossarySidePanel.tsx",
        "src/components/HomeScreen.tsx",
        "src/components/ModeSelector.test.tsx",
        "src/components/ModeSelector.tsx",
        "src/components/ProgressBar.test.tsx",
        "src/components/ProgressBar.tsx",
        "src/components/SummaryTab.test.tsx",
        "src/components/SummaryTab.tsx",
        "src/components/ThemeSelector.test.tsx",
        "src/components/ThemeSelector.tsx",
        "src/components/ThemeSummaryTable.test.tsx",
        "src/components/ThemeSummaryTable.tsx",
        "src/constants.ts",
        "src/utils/getProgressColorClass.test.ts",
        "src/utils/getProgressColorClass.ts",
        "src/utils/summaryView.ts"
      ]
    }
  ]
}
---

# Refonte Accessipote — direction retenue (handoff design)

## Contexte

Le dossier `/Users/sam/Downloads/design_handoff_accessipote_redesign/` contient un handoff
de refonte complet (README.md normatif + 3 maquettes `.dc.html` haute-fidélité + `tokens.css`
+ `tailwind.config.js`). Objectif : **ne rien changer aux données, calculs et exports**, mais
refondre structure de navigation, modèle de données de surface (audits nommés au lieu d'un
état anonyme unique) et direction visuelle (N&B + statut = seule couleur, AAA 7:1).

Le README du handoff (`README.md`, 707 lignes) est la spec exécutable normative — ce plan n'en
recopie pas le détail pixel, il l'organise en phases et documente les décisions d'architecture
que le handoff laisse ouvertes ou qui touchent du code non couvert par le handoff (types, hooks
existants, tests).

**Fichiers explorés** (contexte déjà en main, pas à relire) :
`App.tsx`, `types/index.ts`, `constants.ts`, tous les composants de `src/components/`, tous les
hooks de `src/hooks/`, tous les utils de `src/utils/`, `criteria.json`/`glossary.json` (formes),
`index.css`/`index.html`/`vite.config.ts` (CSP + police auto-hébergée), `vitest.config.ts`,
`eslint.config.js`, `package.json`.

## Invariants (ne jamais casser)

- `calculateSummaryStats.ts`, `exportMarkdown.ts`, `transformCriteria.ts` : logique inchangée.
  Distinction **évalués** (conforme+nonConforme+nonApplicable) vs **tranchés**
  (conforme+nonConforme) déjà correcte dans `calculateSummaryStats` — seul l'affichage les
  confondait, à corriger en Phase 6.
- `useProgress.ts` : les transitions d'état (2ᵉ clic sur statut actif → efface) restent identiques.
- Ancienne clé `localStorage['rgaa-progress']` **jamais supprimée**.
- CSP stricte de `index.html` inchangée ; `devCspPlugin` dans `vite.config.ts` conservé tel quel.
- `criteria.json` / `glossary.json` non modifiés.
- 13 thèmes, 106 critères, 213 termes de glossaire — comptes non modifiés.

## Décisions d'architecture (tranchées, pas de question à poser)

1. **Pas de router.** `view: 'home' | 'audit' | 'summary' | 'glossary'` en `useState` dans
   `App.tsx`. Raison : CLAUDE.md interdit toute nouvelle dépendance non demandée ; le handoff
   valide explicitement cette option ("au choix").
2. **`ModeSelector.tsx` (switch `role="switch"`) est retiré**, pas repeint. Le bloc 01
   ("Mode de vérification") est un `<fieldset>` de deux `<label>` radio — sémantique différente
   d'un switch booléen. Recréer proprement dans `NewAuditForm.tsx` plutôt que forcer l'ancien
   composant coûte moins cher et évite un composant hybride confus. `ModeSelector.tsx` +
   son test sont supprimés.
3. **`ThemeSelector.tsx` est retiré**, remplacé par deux usages distincts (le handoff les
   confond sous un même nom mais leurs sémantiques diffèrent) :
   - `ThemeRail.tsx` (nouveau) — sélection **unique**, `role="tablist"` navigable aux flèches,
     rail de navigation entre thèmes sur l'écran Audit (bloc 02.2).
   - Un bloc de pills multi-select **inline dans `NewAuditForm.tsx`** ("Thèmes à auditer",
     bloc 01b) — pas de composant partagé : mutualiser une seule primitive pour ces deux
     comportements (single-select nav vs multi-select scoping) ajouterait une branche de props
     conditionnelle pour deux usages qui ne se recroisent jamais.
4. **`@tanstack/react-virtual` retiré** de `CriteriaList.tsx` et du `package.json`
   (`pnpm remove @tanstack/react-virtual` — suppression de dépendance, pas ajout, mais signalé
   pour transparence). Justifié par le handoff : le plus gros thème fait 14 critères.
5. **Branche dédiée** : `feature/redesign-hifi`, jamais sur `main`. Un commit par phase
   (Conventional Commits FR), lint + build + tests verts avant chaque commit. Pas de push ni de
   PR sans demande explicite.
6. **Polices** : Instrument Sans + JetBrains Mono auto-hébergées comme Chelsea Market
   (`@font-face` dans `index.css`, fichiers `.woff2` dans `public/fonts/`) — jamais Google Fonts
   CDN (CSP `font-src 'self'` l'interdit). Téléchargement des `.woff2` fait en Phase 1 via
   `curl`/`WebFetch` depuis Google Fonts ; si le réseau est indisponible dans l'environnement
   d'exécution, je le signalerai à ce moment précis plutôt que de bloquer maintenant.
7. **`CriteriaItem`/`CriteriaDetail`** : le bloc 03 ("critère déplié") remplace l'actuel
   `showTests`/`showReferences` par un état `expandedCriteriaId` au niveau de la vue Audit — un
   seul critère déplié à la fois, rendu par `CriteriaDetail.tsx` à la place de la carte
   `CriteriaItem` compacte. Tests désormais **cochables individuellement** (`checkedTests` sur
   l'`Audit`), plus note (`notes`) et pages (`pages`) — champs déjà prévus dans le type `Audit`
   du handoff.

## Modèle de données (nouveau)

```ts
// src/types/index.ts — ajout, ne touche pas aux types existants
export interface Audit {
  id: string; name: string; scope?: string; mode: Mode;
  themes: string[]; createdAt: string; updatedAt: string;
  progress: Progress['classic'] | Progress['designSystem'];
  notes: Record<string, string>;
  pages: Record<string, string[]>;
  checkedTests: Record<string, string[]>;
}
export interface AuditStore { version: 2; audits: Audit[]; activeAuditId: string | null; }
```

`src/utils/migrateProgress.ts` (nouveau, testé) : si `localStorage['rgaa-progress']` est
l'ancien format `{classic, designSystem}`, crée un `AuditStore` v2 avec un audit "Mon audit"
(classic) et, si `designSystem` non vide, un second audit "Mon audit (Design System)". Écrit
sous `rgaa-audits`, clé `rgaa-progress` intacte. Suit le pattern déjà utilisé dans `App.tsx`
pour la migration `{criteria}` → `Progress` (fonction de migration passée à `useLocalStorage`).

`src/hooks/useAudits.ts` (nouveau) : CRUD sur `AuditStore` via `useLocalStorage('rgaa-audits', ...)`
— `createAudit`, `updateAudit` (debounce 500ms pour notes/pages, immédiat pour statuts),
`deleteAudit`, `setActiveAuditId`. `useProgress.ts` existant se rebranche sur
`activeAudit.progress` au lieu du `Progress` global — mode déjà figé par l'audit donc la
validation mode-scoped reste identique, juste la source change.

`useFilters.ts` perd la dimension `themes` (devient navigation via `ThemeRail`, plus un
filtre) — `CriteriaFilters` perd son champ `themes`. Signature : theme actif passé séparément,
filtrage par thème fait en amont (dans la vue Audit) avant d'appeler `useFilters` sur les
critères du thème courant, ou `useFilters` reçoit `activeTheme: string | null` en plus. Tests de
`useFilters` sur `themes` sont réécrits (comportement change intentionnellement, ce n'est pas
dans la liste des invariants).

## Fichiers — vue d'ensemble

**Nouveaux** : `Sidebar.tsx`, `AuditRing.tsx`, `StatusPill.tsx`, `StatusButtons.tsx`,
`ThemeRail.tsx`, `HomeScreen.tsx`, `NewAuditForm.tsx`, `GlossaryScreen.tsx`,
`GlossaryPopover.tsx`, `CriteriaDetail.tsx`, `SegmentedGauge.tsx`, `EmptyState.tsx`,
`useAudits.ts`, `migrateProgress.ts` (+ tests pour chaque).

**Réécrits en profondeur** : `App.tsx`, `CriteriaItem.tsx`, `CriteriaList.tsx` (retrait
virtualiseur), `SearchFilters.tsx`, `BulkActions.tsx` (sélection par case à cocher),
`SummaryTab.tsx`, `ThemeSummaryTable.tsx`, `DonutChart.tsx` (arcs à 4px de gap),
`KeyboardShortcutsModal.tsx` (restyle seulement, logique conservée), `ExportButton.tsx`
(restyle + intégration dans bloc 06), `tailwind.config.js`, `index.css`.

**Supprimés** : `ModeSelector.tsx`(+test), `ThemeSelector.tsx`(+test), `ProgressBar.tsx`(+test),
`getProgressColorClass.ts`(+test), `GlossarySidePanel.tsx`(+test — logique de recherche/debounce
réutilisée dans `GlossaryScreen.tsx`, logique de resize supprimée). `MIN/MAX/DEFAULT_PANEL_WIDTH`
retirés de `constants.ts`.

**Inchangés (logique)** : `calculateSummaryStats.ts`, `exportMarkdown.ts`, `transformCriteria.ts`,
`transformGlossary.ts`, `generateWcagLinks.ts`, `parseGlossaryHtml.tsx`, `useProgress.ts` (branché
différemment mais logique interne identique), `useDebounce.ts`, `useDarkMode.ts`,
`useKeyboardShortcuts.ts` (raccourcis étendus : `1/2/3`, `Entrée`, `J/K`, `N`, `⌘E` — ajouts,
pas de retrait), `useToast.ts`, `Toast.tsx`, `ErrorBoundary.tsx`, `DarkModeToggle.tsx` (restyle
Tailwind seulement).

## Phases d'implémentation (ordre du handoff, chaque phase = commit + lint/build/test verts)

**Mode d'exécution confirmé** : j'enchaîne les phases 0→9 d'affilée sans checkpoint, un commit
par phase, lint+build+tests verts avant chaque commit. Arrêt uniquement sur blocage réel.
Polices : je télécharge les `.woff2` et les commite dans `public/fonts/`.

**Phase 0 — Setup.** Créer branche `feature/redesign-hifi`.

**Phase 1 — Fondations visuelles.** Copier `tokens.css` dans `src/`, fusionner
`tailwind.config.js` (remplace les échelles Tailwind par défaut — vérifier que les classes hors
système cassent la compilation, README §Ordre point 1). Télécharger + auto-héberger Instrument
Sans et JetBrains Mono. Retirer Chelsea Market et `font-chelsea-market` de `index.css`. C'est la
phase qui va faire échouer plein de classes Tailwind existantes ailleurs — normal, sert de carte
des endroits à reprendre pour les phases suivantes.

**Phase 2 — Modèle de données.** `migrateProgress.ts` + `useAudits.ts` + tests, **avant toute UI**.

**Phase 3 — Primitives.** `Sidebar.tsx`, `AuditRing.tsx`, `StatusPill.tsx`, `StatusButtons.tsx`,
`SegmentedGauge.tsx` — testées isolément avant d'être consommées.

**Phase 4 — Écran Audit (bloc 02) + `CriteriaItem` + `ThemeRail`.** Retrait du virtualiseur dans
`CriteriaList`. `App.tsx` gagne son état `view`/`activeTheme`/`expandedCriteriaId`.
`handleCriteriaClick` simplifié (bascule thème + `element.focus()`, plus de `setTimeout`).

**Phase 5 — Écran Accueil (bloc 01) + création d'audit.** `HomeScreen.tsx`, `NewAuditForm.tsx`.

**Phase 6 — Synthèse (bloc 04).** Les deux corrections a11y non négociables : colonnes chiffrées
en plus des barres, `aria-label` complet sur le donut, filet 2px entre segments de jauge
(`gap: 2px`, pas de bordure), 4px d'arc vide entre segments du donut. Une seule source de vérité
(`calculateSummaryStats`) pour tous les compteurs affichés.

**Phase 7 — Glossaire (bloc 05) + popover contextuel.** `GlossaryScreen.tsx` (remplace le panneau
latéral redimensionnable), `GlossaryPopover.tsx` (survol/clic contextuel depuis `CriteriaDetail`).
Réutilise `parseGlossaryHtml.tsx` tel quel.

**Phase 8 — États (bloc 06) + mobile (bloc 07) + relecture sombre (bloc 08).** `BulkActions.tsx`
réécrit (sélection par case, barre noire), `EmptyState.tsx`, export restylé, barre d'onglets
basse mobile, boutons de statut en colonne sur mobile, vérification `tokens.css` dark déjà fourni.

**Phase 9 — Passe finale.** Contraste (axe/manuel), navigation clavier complète, lecteur d'écran
sur la synthèse, `prefers-reduced-motion` (déjà dans `tokens.css`), zoom 200% sans perte de
contenu ni scroll horizontal. Recette contre la checklist du README (§ Critères de recette).

Chaque phase : `npm run lint && npm run build && npm run test:run` verts avant commit ; agent
`code-reviewer` après chaque phase (accessibilité + TypeScript strict + sécurité, per
`.claude/rules/agents.md`) ; `build-error-resolver` si le build casse.

## Vérification finale

- Toutes les cases de la checklist "Critères de recette" du README (v1→audit nommé récupéré,
  aucune info couleur-seule, filets/gaps segments, cohérence des compteurs, cibles 44×44/48×48,
  focus visible clair+sombre, aucune police en demi-pixel, pas de gris hors `--a-ink`/`--a-ink-muted`,
  rayons concentriques, `prefers-reduced-motion`, zoom 200%).
- `npm run test:coverage` — pas de régression sur les fichiers à invariants.
- Test manuel navigateur (`npm run dev`) : parcours accueil → création audit → statuer quelques
  critères → synthèse → glossaire → export, en clair et en sombre, desktop et 390px mobile.
- Confirmer que `localStorage['rgaa-progress']` existant (si présent chez l'utilisateur qui
  teste) migre bien vers un audit nommé sans perte.

## Ce qui n'est PAS fait dans ce plan

Pas de mise en place de `react-router`, pas de backend, pas de changement aux données RGAA/
glossaire, pas de nouvelle dépendance hors suppression de `@tanstack/react-virtual`.
