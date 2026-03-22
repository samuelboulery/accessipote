# Accessipote — Outil d'Audit RGAA 4.1

Application React/TypeScript pour vérifier la conformité web aux critères RGAA (Référentiel Général d'Amélioration de l'Accessibilité).

## 🎯 Fonctionnalités principales

### Deux modes d'audit
- **Mode Classique** : Audit traditionnel (conforme / non conforme / non applicable)
- **Mode Design System** : Évaluation système de design (conforme par défaut / à mettre en place / non applicable)

### Onglets de navigation
- **Onglet Critères** : Affichage détaillé des 106 critères RGAA avec tests et références
- **Onglet Synthèse** : Vue d'ensemble avec statistiques (taux de conformité, résumé par thème, distribution des statuts)

### Filtrage avancé
- Recherche textuelle dans critères (ID, titre, description)
- Filtrage par thèmes (multi-sélection)
- Filtrage par statuts

### Suivi de progression
- Barre de progression dynamique
- Résumé détaillé par statut et thème
- Sauvegarde automatique dans localStorage
- Actions en masse (sélectionner/désélectionner tous)

### Glossaire interactif
- Panneau latéral avec 200+ définitions des termes techniques
- Recherche debouncée dans le glossaire
- Navigation hypertexte (liens entre critères ↔ glossaire)
- Redimensionnable (persistance largeur)

### Export des résultats
- **Markdown** : Copie dans le presse-papiers
- **PDF** : Téléchargement en mode classique (groupé par statut)

### Thème sombre / clair
- Toggle en haut à droite
- Persistance dans localStorage

## 📋 Critères couverts

**106 critères RGAA 4.1** couvrant 13 thèmes officiels :
Images, Cadres, Couleurs, Multimédias, Tableaux, Liens, Scripts, Éléments obligatoires, Structuration, Présentation, Formulaires, Navigation, Consultation.

Chaque critère inclut :
- ID RGAA (ex: 1.1)
- Titre et description
- Tests associés
- Références WCAG 2.1 + techniques W3C

## 🚀 Démarrage

```bash
npm install
npm run dev              # Dev server (localhost:5173)
npm run build           # Build production
npm run test            # Tests (Vitest)
npm run test:coverage   # Rapport de couverture
npm run lint            # ESLint
npm run scrape:wcag     # Mettre à jour wcag-anchors.json
```

## 🛠️ Stack technique

| Couche | Technologies |
|--------|------------|
| **UI** | React 19 + TypeScript strict |
| **Build** | Vite 7 + TypeScript compiler |
| **Style** | Tailwind CSS 3 (+ Chelsea Market auto-hébergée) |
| **Icônes** | Lucide React |
| **Export** | jsPDF 4.2.1 + jspdf-autotable (lazy-loaded) |
| **Sécurité** | DOMPurify 3.3.2+ (sanitization HTML) |
| **Tests** | Vitest + @testing-library/react (83% couverture) |
| **Data** | localStorage (client-side, pas de backend) |

## 📦 Architecture

```
src/
├── components/             # 17 composants React
│   ├── CriteriaItem.tsx         (affichage critère unique)
│   ├── CriteriaList.tsx         (virtualized list, 78 critères max)
│   ├── ExportButton.tsx         (Markdown + PDF)
│   ├── GlossarySidePanel.tsx    (panneau latéral, resize handle)
│   ├── SearchFilters.tsx        (recherche + filtres)
│   ├── SummaryTab.tsx           (stats)
│   └── ...
├── hooks/                  # 8 hooks personnalisés
│   ├── useFilters.ts            (state filtres)
│   ├── useProgress.ts           (calcul progression)
│   ├── useLocalStorage.ts       (persistance + migration schema)
│   ├── useDebounce.ts           (200ms debounce)
│   └── ...
├── utils/                  # Utilitaires purs
│   ├── parseGlossaryHtml.tsx    (DOMPurify + liens)
│   ├── generateWcagLinks.ts     (mappage critères → W3C)
│   ├── exportMarkdown.ts        (Markdown + PDF gen)
│   └── ...
├── data/                   # JSON statiques (RGAA officiels)
│   ├── criteria.json       (106 critères)
│   ├── glossary.json       (200+ termes)
│   └── wcag-anchors.json   (mapping → W3C)
├── types/index.ts          # Types TypeScript partagés
└── constants.ts            # Constantes app
```

## 🔒 Sécurité

✅ **CSP (Content Security Policy)** stricte sans `'unsafe-inline'`
- Production : CSP maximalement restrictive (fichiers locaux uniquement)
- Dev : `transformIndexHtml` relâche pour HMR Tailwind

✅ **XSS Prevention**
- DOMPurify sur tous les HTML externes (glossaire)
- Pas de `dangerouslySetInnerHTML` dans le code
- Validation schema localStorage

✅ **Input Validation**
- Recherche limitée à 200 caractères
- Filtres enumérés (thèmes, statuts, niveaux)
- JSON parsing robuste avec migration schema

✅ **Dépendances** : `npm audit` = 0 vulnérabilités (maj: jsPDF 4.2.1, DOMPurify 3.3.2+)

## ⚡ Performance

| Métrique | Valeur |
|----------|--------|
| Bundle gzip | ~400 kB |
| Core Web Vitals | A (Lighthouse) |
| Chunk splitting | React + PDF + UI vendored |
| Lazy loading | jsPDF (chargé à l'export) |
| List virtualization | 78 critères (CriteriaList) |
| Debouncing | Glossaire search (200ms) |

## ♿ Accessibilité

- ✅ Navigation clavier complète (Tab, Entrée, Échap)
- ✅ ARIA labels/roles sur tous les composants
- ✅ Focus management (FocusTrap, focus-visible)
- ✅ Feedback visuel + toasts
- ✅ Contrast ratio WCAG AA+
- ✅ Responsive design mobile/tablet/desktop

## 🧪 Tests

**83.42% couverture** (428 tests) — Vitest + @testing-library/react

- ✅ CriteriaItem (25 tests)
- ✅ ExportButton (12 tests)
- ✅ GlossarySidePanel (34 tests)
- ✅ ThemeSelector (11 tests)
- ✅ 8 hooks (+ utils)

Tous les tests passent : `npm run test`

## 📄 Licence

Données officielles RGAA © [DINUM](https://accessibilite.numerique.gouv.fr/)

## 🤝 Contribution

Ouvrez une issue pour discuter des changements avant une PR.
