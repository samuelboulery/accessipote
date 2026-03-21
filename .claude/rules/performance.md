# Performance — Accessipote

## Gestion du contexte

- Fenêtre de contexte optimale : rester sous 80% d'utilisation
- Utiliser `/compact` après chaque phase terminée (exploration → implémentation)
- Utiliser `/clear` entre deux tâches non liées
- Ne jamais commencer un refactoring large si le contexte dépasse 60%

## Taille des fichiers

Objectif : fichiers de 200-400 lignes pour un meilleur taux de réussite au premier essai.
- Composants > 400 lignes → découper en sous-composants
- Hooks > 200 lignes → extraire de la logique dans des utils
- Utils > 300 lignes → séparer par domaine fonctionnel

## Sélection du modèle

| Tâche | Modèle |
|-------|--------|
| Exploration de fichiers, recherche | Haiku |
| Éditions simples (un fichier) | Haiku |
| Implémentation multi-fichiers | Sonnet |
| Architecture, refactoring large | Opus |
| Audit sécurité, CSP | Opus |
| Écriture de tests | Sonnet |
| Correction d'erreurs de build | Sonnet |

## Optimisations React

- Utiliser `React.memo` uniquement sur les composants prouvés coûteux à re-rendre
- `useMemo` et `useCallback` seulement quand le profiling le justifie
- Pour les listes > 50 éléments : envisager la virtualisation (`@tanstack/virtual`)
- `CriteriaList.tsx` peut afficher jusqu'à 78 critères — candidat à la virtualisation

## Sessions longues

Compacter aux moments logiques :
- Après la phase de recherche, avant l'implémentation
- Après avoir terminé une feature complète
- Quand on change de sujet (ex: tests → dark mode)

Ne pas compacter :
- En milieu d'implémentation (perte des noms de variables, chemins de fichiers)
- Quand un bug actif nécessite de garder le contexte
