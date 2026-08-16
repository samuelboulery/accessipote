# Accessipote — conventions du projet

Ce fichier est destiné aux agents de codage (Claude Code et équivalents). Il
rassemble ce qu'on ne devine pas en lisant le code. Pour contribuer à la main,
voir [CONTRIBUTING.md](./CONTRIBUTING.md), qui dit la même chose en plus
détaillé.

## Présentation du projet
Outil d'audit RGAA 4.1 (accessibilité web française) en React.
Le travail est un **audit nommé** (créé, daté, reprenable), avec un mode figé à
la création : Classic (audit standard) ou Design System.
Cible : auditeurs accessibilité, équipes design, développeurs.
URL dev : http://localhost:5173

## Stack technique
- React 19 + TypeScript strict + Vite 7
- Tailwind CSS 4, échelle restreinte aux jetons du design (voir `src/tokens.css` et le bloc `@theme` de `src/index.css`)
- Lucide React pour les icônes
- jsPDF pour les exports PDF
- Vitest + Testing Library pour les tests
- localStorage pour la persistance (pas de backend)

## Règles critiques
1. TypeScript strict — pas de `any` sans justification documentée
2. Jamais de console.log en production
3. Jamais de alert() ou confirm() — utiliser des composants UI dédiés
4. Ne pas modifier criteria.json ni glossary.json (données RGAA officielles)
5. Ne jamais écrire ni supprimer `localStorage['rgaa-progress']` (données v1, lecture seule)
6. Ne pas introduire de nouvelle librairie sans demande explicite
7. Immutabilité — ne jamais muter les objets ou tableaux directement
8. 80% de couverture de tests minimum

## Organisation des fichiers
- `src/components/` → Composants React purs (200-400 lignes max)
- `src/hooks/` → Logique d'état et effets de bord
- `src/utils/` → Fonctions pures sans état
- `src/data/` → JSON statiques (source de vérité RGAA)
- `src/types/index.ts` → Source de vérité pour tous les types

## Commandes disponibles
Gestionnaire de paquets : **pnpm** exclusivement.

- pnpm dev → serveur de développement (port 5173)
- pnpm build → build TypeScript + Vite
- pnpm test:run → tests unitaires (non-watch, pour CI)
- pnpm test → Vitest (watch)
- pnpm test:coverage → rapport de couverture
- pnpm lint → ESLint
- pnpm scrape:wcag → mise à jour des ancres WCAG

## Pièges connus
- CSP : `index.html` a une CSP stricte sans `'unsafe-inline'`. En dev, le plugin `devCspPlugin`
  dans `vite.config.ts` l'assouplit via `transformIndexHtml`. Ne pas supprimer ce plugin.
- `coverage/` doit être dans `globalIgnores` de `eslint.config.js` (fichiers générés).
- Tests de performance dans `CriteriaList.test.tsx` : seuils à 2000ms (pas 200ms) car les
  runners CI sont plus lents qu'en local.
- L'échelle Tailwind par défaut est **remplacée** par celle du design : `text-sm`,
  `rounded-lg`, `p-5`, `text-gray-600` n'existent plus. Une classe hors système ne
  produit aucun style — c'est volontaire, ça rend les dérives visibles. Depuis
  Tailwind 4 le thème vit dans le bloc `@theme` de `src/index.css` ; il n'y a
  plus de `tailwind.config.js`.
- Les tailles de police sont en `rem` et non en `px` : le zoom texte du navigateur
  doit agir dessus (RGAA 10.4).
- Un contrôle de 40px de haut porte la classe `target-44` (pseudo-élément qui étend
  la zone cliquable). Un `<input>` ne pouvant pas porter de pseudo-élément, il passe
  directement à 44px.
- Statut = `src/utils/statusPresentation.ts`, source unique. Jamais la couleur seule :
  chaque statut porte une icône de forme distincte et un libellé.
- Compteurs de synthèse = `src/utils/summaryView.ts`, source unique. « évalués »
  (conforme + écarts + non applicable) n'est pas « tranchés » (conforme + écarts) :
  deux dénominateurs différents.
- `src/data/criteria.json` et `glossary.json` : ne jamais modifier (données RGAA officielles).

## Avant de proposer un changement

Dans l'ordre : `pnpm lint`, `pnpm build`, `pnpm test:run`. Les trois doivent
passer. Écrire le test avant l'implémentation.

## Architecture des écrans

Barre latérale de 244px et quatre destinations (`view` en state dans `App.tsx`, pas
de routeur) : Accueil, Audit, Synthèse, Glossaire. L'audit se parcourt **un thème à
la fois** via `ThemeRail` — le thème est la navigation, pas un filtre.

- `src/hooks/useAudits.ts` → CRUD des audits sur `localStorage['rgaa-audits']`
- `src/utils/migrateProgress.ts` → migration v1 vers v2, sans toucher à l'ancienne clé

## Contexte métier
- RGAA = Référentiel Général d'Amélioration de l'Accessibilité (France)
- 106 critères WCAG adaptés, organisés en 13 thèmes
- Conformité = critères conformes / (conformes + non-conformes) × 100
- Techniques WCAG : préfixes G (général), H (HTML), ARIA, F (échec), SCR (script)
