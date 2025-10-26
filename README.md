# Accessipote - Outil de Vérification de Conformité

Application web pour la vérification de conformité aux critères RGAA (Référentiel Général d'Amélioration de l'Accessibilité).

## 🎯 Fonctionnalités

- **Deux modes de vérification** :
  - **Mode Classique** : Audit traditionnel conforme/non conforme/non applicable
  - **Mode Design System** : Évaluation pour systèmes de design (conforme par défaut / à mettre en place)

- **Filtrage avancé** des critères :
  - Recherche textuelle (ID, titre, description)
  - Filtres par thème (multi-sélection)
  - Filtres par niveau (A, AA, AAA)
  - Filtres par statut

- **Suivi de progression** :
  - Barre de progression basée sur les critères sélectionnés
  - Sauvegarde automatique dans le localStorage
  - Actions en masse (sélection/désélection globale)

- **Glossaire interactif** :
  - Panneau latéral avec définitions des termes techniques
  - Navigation par liens dans les critères
  - Recherche dans le glossaire
  - Redimensionnable

- **Export des résultats** :
  - Markdown (copié dans le presse-papiers)
  - PDF (téléchargement)

## 📋 Critères supportés

L'application couvre tous les critères RGAA (version 4.1) organisés par thèmes :
- Images
- Cadres
- Couleurs
- Multimédias
- Tableaux
- Liens
- Scripts
- Éléments obligatoires
- Structuration de l'information
- Présentation de l'information
- Formulaires
- Navigation
- Consultation

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## 🔗 Liens WCAG

L'application intègre des liens cliquables vers les critères WCAG 2.1 en français et les techniques associées :

- **Références WCAG** : Chaque référence WCAG (ex: "1.3.1 Info and Relationships (A)") est transformée en lien vers le site officiel français des WCAG
- **Techniques** : Chaque technique (ex: "G14", "H36", "ARIA4") est transformée en lien vers la documentation W3C

### Mise à jour des ancres WCAG

Pour mettre à jour le fichier de correspondances entre les critères WCAG et leurs ancres :

```bash
# Exécuter le script de scraping pour générer src/data/wcag-anchors.json
npm run scrape:wcag
```

Le script télécharge automatiquement le contenu depuis https://www.w3.org/Translations/WCAG21-fr/ et génère le fichier JSON.

## 🛠️ Technologies

- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Styling utilitaire
- **Lucide React** - Icônes
- **jsPDF** - Génération PDF (chargé à la demande)
- **DOMPurify** - Sanitization HTML

## 📦 Architecture

```
src/
├── components/          # Composants React
│   ├── CriteriaItem.tsx       # Affichage d'un critère
│   ├── CriteriaList.tsx      # Liste des critères
│   ├── ExportButton.tsx      # Boutons d'export
│   ├── GlossarySidePanel.tsx # Panneau glossaire
│   ├── ErrorBoundary.tsx     # Gestion d'erreurs
│   └── ...
├── hooks/              # Hooks personnalisés
│   ├── useFilters.ts         # Gestion des filtres
│   ├── useProgress.ts        # Gestion du progrès
│   └── useLocalStorage.ts    # Persistance des données
├── utils/              # Utilitaires
│   ├── transformCriteria.ts  # Transformation données
│   ├── transformGlossary.ts  # Gestion glossaire
│   ├── parseMarkdown.tsx     # Parser markdown
│   ├── parseInlineCode.tsx   # Parser code inline
│   └── generateWcagLinks.ts  # Génération liens WCAG
├── scripts/            # Scripts utilitaires
│   └── scrapeWcag.js   # Scraping ancres WCAG
├── data/               # Données statiques
│   ├── criteria.json   # Critères RGAA
│   ├── glossary.json   # Glossaire des termes
│   └── wcag-anchors.json # Mapping critères → ancres WCAG
├── types/              # Types TypeScript
│   └── index.ts        # Interfaces principales
└── constants.ts        # Constantes de l'application
```

## 🔒 Sécurité

- ✅ Sanitization HTML avec DOMPurify pour éviter les injections XSS
- ✅ Validation des données localStorage
- ✅ Error Boundary pour éviter les crashes complets
- ✅ Échappement des caractères spéciaux dans les recherches

## ⚡ Performances

- **Bundle initial** : ~550 kB (code splitting)
- **Chargement à la demande** : jsPDF chargé uniquement lors de l'export
- **Mémorisation** : Composants optimisés avec React.memo et useMemo
- **Debouncing** : À implémenter pour la recherche (Phase 3)

## ♿ Accessibilité

- Navigation au clavier complète
- Attributs ARIA sur les éléments interactifs
- Feedback visuel pour toutes les actions
- Labels descriptifs pour les boutons du glossaire

## 🧪 Tests

Les tests seront implémentés dans une version future.

## 📄 Licence

Ce projet utilise les données officielles du [RGAA](https://accessibilite.numerique.gouv.fr/).

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue pour discuter de vos changements avant de créer une PR.

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur le repository.
