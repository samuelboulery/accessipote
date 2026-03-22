# Accessipote — Configuration Claude Code

## Présentation du projet
Outil d'audit RGAA 4.1 (accessibilité web française) en React.
Deux modes : Classic (audit standard) et Design System.
Cible : auditeurs accessibilité, équipes design, développeurs.
URL dev : http://localhost:5173

## Stack technique
- React 19 + TypeScript strict + Vite 7
- Tailwind CSS 3 (pas de CSS custom sauf App.css/index.css)
- Lucide React pour les icônes
- jsPDF pour les exports PDF
- Vitest + Testing Library pour les tests
- localStorage pour la persistance (pas de backend)

## Règles critiques
1. TypeScript strict — pas de `any` sans justification documentée
2. Jamais de console.log en production
3. Jamais de alert() ou confirm() — utiliser des composants UI dédiés
4. Ne pas modifier criteria.json ni glossary.json (données RGAA officielles)
5. Ne pas casser le schéma localStorage (migration dans useLocalStorage.ts)
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
- npm run dev → serveur de développement (port 5173)
- npm run build → build TypeScript + Vite
- npm run test:run → tests unitaires (non-watch, pour CI)
- npm run test → Vitest (watch)
- npm run test:coverage → rapport de couverture
- npm run lint → ESLint
- npm run scrape:wcag → mise à jour des ancres WCAG

## Pièges connus
- CSP : `index.html` a une CSP stricte sans `'unsafe-inline'`. En dev, le plugin `devCspPlugin`
  dans `vite.config.ts` l'assouplit via `transformIndexHtml`. Ne pas supprimer ce plugin.
- `coverage/` doit être dans `globalIgnores` de `eslint.config.js` (fichiers générés).
- Tests de performance dans `CriteriaList.test.tsx` : seuils à 2000ms (pas 200ms) car les
  runners CI sont plus lents qu'en local.
- `src/data/criteria.json` et `glossary.json` : ne jamais modifier (données RGAA officielles).

## Subagents disponibles
- /tdd → écriture test-first
- /code-review → review qualité et sécurité
- /plan → décomposition de feature
- /build-fix → résolution erreurs build TypeScript
- /pre-commit → vérification avant commit (lint + build + tests)
- /audit-a11y → audit accessibilité des composants

## Contexte métier
- RGAA = Référentiel Général d'Amélioration de l'Accessibilité (France)
- 106 critères WCAG adaptés, organisés en 13 thèmes
- Conformité = critères conformes / (conformes + non-conformes) × 100
- Techniques WCAG : préfixes G (général), H (HTML), ARIA, F (échec), SCR (script)
