# Git Workflow — Accessipote

## Format des commits (Conventional Commits)

```
<type>: <description courte en français>

<corps optionnel : pourquoi, pas quoi>
```

Types autorisés : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Exemples :
```
feat: ajouter le composant Toast pour les notifications
fix: corriger le filtre combiné thème + statut pour les critères NA
test: couvrir les cas limites de exportMarkdown.ts
refactor: extraire la logique PDF commune dans exportPdfBase.ts
```

## Avant tout commit

Lancer `/pre-commit` ou vérifier manuellement :
1. `npm run lint` — zéro erreur ESLint
2. `npm run build` — build TypeScript sans erreur
3. `npm run test` — tous les tests passent
4. Aucun `console.log` ni `alert()` dans `src/`

## Branches

- `main` — branche stable, toujours buildable
- `feature/<nom>` — une feature = une branche
- Utiliser les worktrees Git pour les features parallèles indépendantes

## Protection des données RGAA

Ne jamais commiter de modifications sur :
- `src/data/criteria.json`
- `src/data/glossary.json`

Ces fichiers sont la source de vérité officielle RGAA — toute modification doit être intentionnelle et documentée.
