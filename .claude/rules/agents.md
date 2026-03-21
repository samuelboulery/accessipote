# Agents — Accessipote

## Agents disponibles

| Agent | Commande | Quand l'utiliser |
|-------|----------|-----------------|
| tdd-guide | `/tdd` | Toute nouvelle feature ou correction de bug |
| code-reviewer | `/code-review` | Après chaque implémentation |
| build-error-resolver | `/build-fix` | Quand `npm run build` ou `tsc` échoue |
| planner | `/plan` | Avant toute feature complexe multi-fichiers |

## Workflow recommandé

Toujours dans cet ordre :
```
1. RESEARCH   → explorer le code existant avant de modifier
2. PLAN       → /plan "description de la feature"
3. IMPLEMENT  → /tdd (tests en premier)
4. REVIEW     → /code-review
5. VERIFY     → /build-fix si besoin + npm run test
```

## Règles de délégation

Déléguer à un subagent quand :
- La tâche touche plus de 3 fichiers simultanément
- Une phase de recherche/exploration est nécessaire avant l'implémentation
- Le contexte approche 80% de la fenêtre (utiliser `/compact` d'abord)

Ne pas déléguer pour :
- Corrections simples d'un seul fichier
- Renommages ou déplacements de fichiers
- Mises à jour de documentation

## Exécution parallèle

Pour les tâches indépendantes, lancer plusieurs agents en parallèle :
```
# Exemple : audit complet
Agent 1 : analyse couverture de tests (hooks)
Agent 2 : audit accessibilité (composants)
Agent 3 : vérification sécurité (CSP + localStorage)
```

Utiliser les worktrees Git pour les features parallèles :
```bash
git worktree add ../accessipote-feature-a feature/a
git worktree add ../accessipote-feature-b feature/b
```
