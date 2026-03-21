# 🚀 Plan d'amélioration d'Accessipote avec Claude Code

> Guide stratégique et opérationnel pour améliorer le projet en utilisant Claude Code efficacement.
> Basé sur les **deux guides officiels** du repo [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
> (Shortform Guide + Longform Guide) + analyse approfondie du projet Accessipote.

---

## 📋 Table des matières

1. [Fondation : configurer Claude Code pour ce projet](#1-fondation)
2. [Principes clés — ce que les guides t'apprennent](#2-principes)
3. [Hooks spécifiques à Accessipote](#3-hooks)
4. [Optimisation des tokens et des coûts](#4-tokens)
5. [Mémoire de session et contexte dynamique](#5-mémoire)
6. [Parallelisation et agents](#6-parallelisation)
7. [Phases d'amélioration du projet](#7-phases)
8. [Catalogue de tâches concrètes](#8-tâches)
9. [Commandes personnalisées à créer](#9-commandes)

---

## 1. Fondation : configurer Claude Code pour ce projet

### 1.1 Créer le fichier `CLAUDE.md` (priorité absolue n°1)

Le guide shortform est catégorique : c'est **la** fondation. Claude Code lit ce fichier automatiquement à chaque session.

**Créer `/outil-checklist-rgaa/CLAUDE.md` :**

```markdown
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

## Format de réponse API (si futur backend)
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

## Commandes disponibles
- npm run dev → serveur de développement (port 5173)
- npm run build → build TypeScript + Vite
- npm run test → Vitest
- npm run test:coverage → rapport de couverture
- npm run lint → ESLint
- npm run scrape:wcag → mise à jour des ancres WCAG

## Subagents disponibles
- /tdd → écriture test-first
- /code-review → review qualité et sécurité
- /plan → décomposition de feature
- /build-fix → résolution erreurs build TypeScript

## Contexte métier
- RGAA = Référentiel Général d'Amélioration de l'Accessibilité (France)
- 106 critères WCAG adaptés, organisés en 13 thèmes
- Conformité = critères conformes / (conformes + non-conformes) × 100
- Techniques WCAG : préfixes G (général), H (HTML), ARIA, F (échec), SCR (script)
```

### 1.2 Créer la structure `.claude/rules/`

Inspiré du guide shortform : modèle en fichiers modulaires plutôt qu'un seul CLAUDE.md monolithique.

```
.claude/
├── rules/
│   ├── coding-style.md     → Immutabilité, taille de fichiers, conventions TS
│   ├── testing.md          → TDD workflow, seuils de couverture
│   ├── security.md         → Pas de secrets, validation, CSP
│   ├── git-workflow.md     → Format de commits conventionnels
│   ├── agents.md           → Quand déléguer à un subagent
│   └── performance.md      → Sélection de modèle, gestion du contexte
└── commands/
    ├── add-component.md
    ├── test-coverage.md
    ├── audit-a11y.md
    └── pre-commit.md
```

**Contenu de `.claude/rules/coding-style.md` :**
```markdown
# Style de code — Accessipote

- TypeScript strict, pas de `any`
- Fichiers de 200-400 lignes, 800 lignes maximum
- Pas d'emoji dans le code ou les commentaires
- Toujours utiliser l'immutabilité : spread operator ou immer
- Pas de console.log (hook PostToolUse le détecte automatiquement)
- Nommage : composants PascalCase, hooks camelCase préfixé use, utils camelCase
- Les chaînes visibles sont en FRANÇAIS
```

**Contenu de `.claude/rules/testing.md` :**
```markdown
# Tests — Accessipote

- TDD : écrire les tests AVANT l'implémentation
- 80% de couverture minimum (lignes et branches)
- Ordre de priorité : hooks > utils > composants
- Framework : Vitest + @testing-library/react
- Chaque hook doit avoir son fichier de test correspondant
- Tester les cas limites : liste vide, valeurs undefined, mode classic vs design-system
```

---

## 2. Principes clés — ce que les guides t'apprennent

### 2.1 Skills vs Commands : la distinction essentielle

Le guide shortform clarifie :
- **Skills** (`~/.claude/skills/`) → définitions de workflows plus larges, avec codemaps
- **Commands** (`~/.claude/commands/`) → prompts exécutables via `/mon-commande`

Pour Accessipote, utilise les **commands** pour les workflows répétitifs locaux.

### 2.2 Les raccourcis clavier essentiels

Directement depuis le guide shortform — à connaître absolument :

| Raccourci | Action |
|-----------|--------|
| `Ctrl+U` | Effacer toute la ligne (plus rapide que backspace) |
| `!` préfixe | Exécuter une commande bash directement |
| `@` préfixe | Rechercher un fichier dans le projet |
| `Shift+Enter` | Saisie multi-ligne |
| `Tab` | Afficher/masquer la réflexion de Claude |
| `Esc Esc` | Interrompre Claude / restaurer le code |

### 2.3 Le principe de la tâche atomique

❌ **Ne jamais faire :**
```
"Améliore tout Accessipote — ajoute le dark mode, la sécurité, les tests et l'UX"
```

✅ **Toujours faire :**
```
"Dans ExportButton.tsx, remplace les appels alert() par un composant Toast.
Le Toast doit : apparaître en bas à droite, être en vert (succès) ou rouge (erreur),
disparaître après 3s, respecter prefers-reduced-motion."
```

### 2.4 Les phases d'un workflow propre

D'après le guide longform — **toujours dans cet ordre** :

```
Phase 1 : RESEARCH   → sous-agent Explore
Phase 2 : PLAN       → /plan "description de la feature"
Phase 3 : IMPLEMENT  → /tdd (tests first)
Phase 4 : REVIEW     → /code-review
Phase 5 : VERIFY     → /build-fix si besoin + npm run test
```

### 2.5 Donner du CONTEXTE, pas juste la requête

> *"The sub-agent only knows the literal query, not the PURPOSE behind the request."* — Longform Guide

Mauvais :
```
"Corrige useFilters.ts"
```

Bon :
```
"Dans useFilters.ts, le filtre combiné thème + niveau + statut ne retourne pas
les critères qui ont le statut 'not-applicable' quand on filtre par thème.
Le bug est apparu après l'ajout du filtrage par statut en novembre.
Le comportement attendu : un critère NA doit apparaître si son thème correspond,
peu importe le filtre statut."
```

### 2.6 Utiliser `/fork` pour les tâches non-overlapping

Le guide shortform recommande `/fork` pour travailler sur des tâches parallèles indépendantes sans accumuler de contexte inutile. Exemple :

- **Conversation principale** : implémentation du dark mode
- **Fork 1** : questions sur l'architecture CSS actuelle
- **Fork 2** : recherche sur les meilleures pratiques dark mode React

### 2.7 Commandes de gestion de session indispensables

| Commande | Quand l'utiliser |
|----------|-----------------|
| `/clear` | Entre deux tâches non liées (gratuit, instantané) |
| `/compact` | Après avoir terminé une phase (ex: recherche faite, avant implémentation) |
| `/cost` | Pour surveiller les tokens dépensés pendant une session |
| `/rewind` | Pour revenir à un état précédent |
| `/checkpoints` | Points de restauration au niveau des fichiers |

---

## 3. Hooks spécifiques à Accessipote

Les hooks sont des **automations déclenchées sur les événements d'outils**. Voici les hooks à mettre en place dans `.claude/settings.json` :

### 3.1 Hook : console.log warning (PostToolUse)

Détecte automatiquement les console.log oubliés dans les fichiers TypeScript :

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.(ts|tsx)$\"",
      "hooks": [{
        "type": "command",
        "command": "grep -n 'console\\.log' \"$TOOL_INPUT_FILE_PATH\" && echo '[Hook] ⚠️ console.log détecté — à supprimer avant commit' >&2 || true"
      }]
    }
  ]
}
```

### 3.2 Hook : TypeScript check après chaque édition (PostToolUse)

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.(ts|tsx)$\"",
      "hooks": [{
        "type": "command",
        "command": "cd /path/to/project && npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -20 >&2 || true"
      }]
    }
  ]
}
```

### 3.3 Hook : rappel tmux pour les longues commandes (PreToolUse)

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run build|npm run test|npm install)\"",
      "hooks": [{
        "type": "command",
        "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] 💡 Considère tmux pour les commandes longues : tmux new -s dev' >&2; fi"
      }]
    }
  ]
}
```

### 3.4 Hook : sauvegarde de session (Stop)

Inspiré du guide longform — sauvegarde l'état en fin de session :

```json
{
  "Stop": [
    {
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo \"Session terminée le $(date '+%Y-%m-%d %H:%M')\" >> ~/.claude/.sessions/accessipote.log"
      }]
    }
  ]
}
```

---

## 4. Optimisation des tokens et des coûts

Le guide longform consacre une section entière à ce sujet. Voici ce qui s'applique à Accessipote.

### 4.1 Sélection du modèle par type de tâche

| Tâche | Modèle recommandé | Raison |
|-------|-------------------|--------|
| Exploration/recherche de fichiers | Haiku | Rapide, pas cher, suffisant |
| Éditions simples (un fichier) | Haiku | Instructions claires = Haiku suffisant |
| Implémentation multi-fichiers | Sonnet | Meilleur équilibre pour le code |
| Architecture / refactoring large | Opus | Raisonnement profond nécessaire |
| Audit sécurité CSP | Opus | On ne peut pas se permettre des ratés |
| Écriture de tests | Sonnet | Comprend le contexte, capte les nuances |
| Correction d'erreurs de build | Sonnet | Standard pour le débogage |

**Configuration dans `~/.claude/settings.json` :**
```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

> **Impact :** Passer de opus à sonnet = ~60% de réduction de coût. `MAX_THINKING_TOKENS` à 10 000 = ~70% de réduction sur le coût de réflexion cachée par requête. Compaction à 50% au lieu de 95% = meilleure qualité sur les sessions longues.

### 4.2 Remplacement des MCPs par des CLIs + skills (token-efficient)

Le guide longform insiste : **chaque MCP actif réduit ta fenêtre de contexte de 200k à ~70k**.

Pour Accessipote (projet frontend pur), désactive tout sauf l'essentiel. Si tu dois ajouter un backend Supabase plus tard, crée plutôt des commandes CLI :

```bash
# Au lieu du MCP Supabase, crée une commande .claude/commands/db-query.md :
# "Utilise `npx supabase db query '<sql>'` pour interroger la base"
```

### 4.3 Compaction stratégique (pas automatique)

D'après le guide longform : **désactive l'auto-compaction et compacte manuellement** aux moments logiques.

Quand compacter :
- ✅ Après la phase de recherche/exploration, avant l'implémentation
- ✅ Après avoir terminé une feature complète
- ✅ Après le debugging, avant de reprendre une autre feature
- ✅ Quand tu changes de sujet (ex: tests → dark mode)

Quand NE PAS compacter :
- ❌ En milieu d'implémentation (tu perds les noms de variables, chemins de fichiers)
- ❌ Quand tu as besoin de garder le contexte d'un bug actif

---

## 5. Mémoire de session et contexte dynamique

### 5.1 Fichiers de session (pattern du guide longform)

Pour les sessions longues sur Accessipote, utilise ce pattern :

```
.claude/
└── .sessions/
    ├── 2026-03-21-dark-mode.md      → Session du jour
    ├── 2026-03-20-toast-system.md   → Sessions précédentes
    └── accessipote.log              → Log simple des sessions
```

**Structure d'un fichier de session :**
```markdown
# Session : Implémentation du dark mode — 2026-03-21

## Ce qui a fonctionné
- Utiliser la stratégie 'class' de Tailwind (pas 'media') pour contrôler manuellement
- Le hook useDarkMode doit lire la préférence OS ET le localStorage

## Ce qui n'a pas fonctionné
- Approche avec CSS custom properties : conflit avec les classes Tailwind
- Modifier tailwind.config.js : nécessite rebuild complet

## Restant à faire
- [ ] Adapter GlossarySidePanel.tsx pour le dark mode
- [ ] Adapter les couleurs de statut (rouge/vert) — vérifier le contraste
- [ ] Tester sur mobile
```

Pour reprendre une session le lendemain :
```
claude --system-prompt "$(cat .claude/.sessions/2026-03-21-dark-mode.md)"
```

### 5.2 Injection de contexte dynamique (avancé)

Crée des alias terminal pour différents modes de travail :

```bash
# Dans ton ~/.zshrc ou ~/.bashrc

# Mode développement standard
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# Mode review de code uniquement
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# Mode recherche / architecture
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

**Contenu de `~/.claude/contexts/dev.md` :**
```markdown
Tu travailles sur Accessipote, un outil d'audit RGAA en React/TypeScript.
Priorité du jour : [à remplir selon le jour]
État actuel : [branch git active]
Contrainte de temps : [si applicable]
Focus : écrire du code propre, tester immédiatement, ne pas sauter les étapes.
```

### 5.3 Continuous Learning — extraire des patterns

Quand Claude résout un problème non trivial (ex: un bug complexe, une approche originale), sauvegarde le pattern :

```
/learn   → extrait les patterns de la session en cours
/evolve  → regroupe les instincts similaires en skills
```

Ces skills sont ensuite automatiquement rechargés dans les sessions futures similaires.

---

## 6. Parallelisation et agents

### 6.1 Git Worktrees pour les features parallèles

Le guide shortform recommande les worktrees Git pour exécuter plusieurs instances de Claude en parallèle **sans conflits** :

```bash
# Créer des worktrees indépendants
git worktree add ../accessipote-toast-system feature/toast
git worktree add ../accessipote-dark-mode feature/dark-mode
git worktree add ../accessipote-tests feature/test-coverage

# Lancer Claude dans chaque worktree (dans des onglets tmux séparés)
cd ../accessipote-toast-system && claude
cd ../accessipote-dark-mode && claude
```

**La méthode cascade :** ouvre les nouvelles tâches à droite, balaie de gauche à droite (les plus anciennes d'abord). Ne garde jamais plus de 3-4 tâches actives.

### 6.2 Le pattern Two-Instance Kickoff pour une nouvelle feature

Quand tu commences une feature importante, lance **deux instances Claude simultanément** :

| Instance 1 : Implémentation | Instance 2 : Recherche |
|-----------------------------|------------------------|
| Crée la structure des fichiers | Explore le code existant |
| Configure les types TypeScript | Cherche les patterns similaires |
| Scaffold le composant | Documente les edge cases |

### 6.3 Subagents recommandés pour Accessipote

Inspirés des agents du repo, voici ceux à créer dans `.claude/agents/` :

**`.claude/agents/tdd-guide.md` :**
```markdown
---
name: tdd-guide
description: Écrit les tests Vitest avant l'implémentation
tools: ["Read", "Write", "Bash"]
model: sonnet
---
Tu es un expert TDD pour React/TypeScript.
Workflow : 1) Lis le code existant 2) Écris les tests (ils doivent échouer)
3) Attends la validation 4) Implémente pour les faire passer.
Jamais de test trivial (rendu basique seulement) — teste le comportement réel.
```

**`.claude/agents/code-reviewer.md` :**
```markdown
---
name: code-reviewer
description: Review code qualité, accessibilité et sécurité
tools: ["Read", "Grep", "Glob"]
model: sonnet
---
Tu es un reviewer senior React/TypeScript spécialisé accessibilité WCAG.
Vérifie : types stricts, pas de any, aria-label manquants,
contraste des couleurs, gestion des erreurs, edge cases.
```

**`.claude/agents/build-error-resolver.md` :**
```markdown
---
name: build-error-resolver
description: Résout les erreurs TypeScript et build Vite
tools: ["Read", "Edit", "Bash"]
model: haiku
---
Tu résous les erreurs TypeScript sans casser les types existants.
Ne jamais utiliser `any` ou `as Type` pour contourner une erreur.
Toujours corriger la cause racine.
```

---

## 7. Phases d'amélioration du projet

### Phase 0 — Fondation Claude Code (1h — À FAIRE MAINTENANT)

| Action | Fichier/outil | Priorité |
|--------|--------------|---------|
| Créer `CLAUDE.md` | Racine du projet | 🔥 Critique |
| Créer `.claude/rules/*.md` | 6 fichiers de règles | Élevée |
| Créer `.claude/commands/*.md` | 4 commandes initiales | Élevée |
| Créer `.claude/agents/*.md` | 3 agents | Moyenne |
| Configurer hooks (console.log, tsc) | `.claude/settings.json` | Élevée |
| Ajouter token settings | `~/.claude/settings.json` | Élevée |

---

### Phase 1 — Qualité et robustesse (Semaine 1)

#### 1A — Remplacer les `alert()` par des Toasts

**Prompt à utiliser :**
```
/plan "Système de notifications Toast pour Accessipote"

Contexte : ExportButton.tsx utilise des alert() natifs pour confirmer
la copie clipboard et signaler les erreurs PDF. C'est une mauvaise UX.

Créer :
1. src/hooks/useToast.ts → état { message, type, visible }, showToast(), hideToast()
2. src/components/Toast.tsx → Tailwind, bas-droite de l'écran, auto-disparition 3s,
   respecte prefers-reduced-motion, types 'success' | 'error' | 'info'
3. Intégration dans App.tsx et remplacement des alert() dans ExportButton.tsx
4. Tests Vitest pour useToast
```

#### 1B — Tests : priorité hooks et utils

**Sessions à créer (dans cet ordre) :**

1. `/tdd` → tests pour `exportMarkdown.ts` (cas : critère compliant, NA, liste vide)
2. `/tdd` → tests pour `transformCriteria.ts` (transformation JSON → objet)
3. `/tdd` → tests pour `generateWcagLinks.ts` (génération d'URLs)
4. `/tdd` → tests pour les composants `ProgressBar.tsx`, `ModeSelector.tsx`

#### 1C — Sécurité : durcir le CSP

```
/plan "Durcir la Content Security Policy de index.html"

Problème : la CSP actuelle utilise 'unsafe-eval' et 'unsafe-inline'.
Objectif : CSP stricte compatible React 19 + Vite + jsPDF.
Méthode : expliquer chaque directive avant d'implémenter.
Tester avec npm run build pour vérifier l'absence d'erreurs.
```

---

### Phase 2 — Améliorations UX (Semaine 2)

#### 2A — Dark Mode

```
/plan "Dark mode pour Accessipote"

Stack : Tailwind darkMode: 'class' (pas 'media').
Créer : hook useDarkMode (lit prefers-color-scheme, persiste en localStorage 'theme')
Adapter : App.tsx (ajoute/retire classe 'dark' sur <html>)
Adapter : composants principaux (CriteriaItem, SearchFilters, GlossarySidePanel)
Ajouter : bouton toggle dans le header
Vérifier : contraste WCAG AA en mode dark pour toutes les couleurs de statut
```

#### 2B — Export PDF pour le mode Design System

```
/plan "Export PDF pour le mode Design System"

Contexte : ExportButton.tsx n'exporte en PDF que pour le mode Classic.
Les statuts Design System sont différents : 'default-compliant' et 'project-implementation'.
Créer : src/utils/exportPdfDesignSystem.ts (inspiré de la logique existante)
Ne pas dupliquer la logique commune → extraire dans exportPdfBase.ts si nécessaire.
```

#### 2C — Import/Export de progression JSON

```
/plan "Import/Export de la progression d'un audit"

Feature : sauvegarder et restaurer une session d'audit complète.
Export : bouton "Sauvegarder l'audit" → télécharge un JSON horodaté
Import : bouton "Charger un audit" → valide le schéma, restaure l'état
Validation : si le schéma ne correspond pas, afficher un message d'erreur via Toast
Compatibilité : respecter useLocalStorage.ts et sa logique de migration
```

#### 2D — Responsive mobile

```
Session d'exploration UNIQUEMENT (pas d'implémentation) :
"Audite la responsivité d'Accessipote sur mobile.
Pour chaque composant dans src/components/, liste les problèmes à < 768px.
Format : fichier, ligne, problème, suggestion de correction."
```

---

### Phase 3 — Nouvelles fonctionnalités (Semaine 3)

#### 3A — Debounce sur la recherche du glossaire

```
"Dans GlossarySidePanel.tsx, applique useDebounce (déjà dans src/hooks/useDebounce.ts)
à la recherche du glossaire. Délai recommandé : 200ms.
Vérifie que le comportement reste identique, ajoute un test."
```

#### 3B — Raccourcis clavier

```
/plan "Raccourcis clavier pour Accessipote"

Créer hook useKeyboardShortcuts :
- Ctrl/Cmd+F → focus champ de recherche
- Ctrl/Cmd+E → exporter en Markdown
- G → toggle glossaire
- Escape → fermer le glossaire
- ? → afficher une modale listant tous les raccourcis
Respecter : ne pas activer quand focus dans un input, aria-keyshortcuts sur les éléments
```

#### 3C — Dashboard statistiques

```
/plan "Vue synthèse avec statistiques d'audit"

Ajouter un onglet 'Synthèse' dans App.tsx avec :
1. Taux de conformité RGAA : C / (C + NC) × 100
2. Graphique donut (SVG natif, pas de lib externe) : compliant/non-compliant/NA
3. Tableau récapitulatif par thème (13 thèmes)
Pas de recharts — le projet n'a pas cette dépendance.
```

---

### Phase 4 — Méta-accessibilité (Semaine 4)

*Point critique : un outil d'audit RGAA doit être lui-même accessible.*

#### 4A — Audit ARIA complet

```
Session d'exploration (pas d'implémentation immédiate) :
"Audite src/components/ et identifie TOUS les problèmes d'accessibilité :
1. Boutons sans aria-label (icônes seules)
2. Roles ARIA manquants ou incorrects
3. Gestion du focus (modal, glossaire, toasts)
4. Ordre de tabulation (tabIndex)
5. Annonces pour lecteurs d'écran lors des changements d'état
6. Indicateurs de statut couleur-only (doivent avoir aussi texte/icône)
Génère un rapport prioritaire avant toute correction."
```

#### 4B — Handle de redimensionnement accessible

```
"Dans GlossarySidePanel.tsx, le handle de redimensionnement n'est pas accessible
au clavier. Implémenter :
- role='separator' aria-orientation='vertical' aria-label='Redimensionner le glossaire'
- Tab pour focus
- Flèches gauche/droite → redimensionner par pas de 10px
- Entrée/Espace → réinitialiser à la taille par défaut (320px)
Ajouter un test pour le support clavier."
```

---

### Phase 5 — Performance (Optionnel)

#### 5A — Virtualisation de la liste de critères

```
"CriteriaList.tsx affiche jusqu'à 78 critères. Implémenter la virtualisation
avec @tanstack/virtual. Mesurer le gain de performance avec Vitest ou Chrome DevTools."
```

---

## 8. Catalogue de tâches concrètes

Backlog ordonné par priorité et impact :

| # | Tâche | Effort | Impact | Phase |
|---|-------|--------|--------|-------|
| 1 | Créer CLAUDE.md | XS | 🔥 Critique | 0 |
| 2 | Créer .claude/rules/ (6 fichiers) | S | Élevé | 0 |
| 3 | Configurer hooks (console.log, tsc) | S | Élevé | 0 |
| 4 | Token settings ~/.claude/settings.json | XS | Élevé | 0 |
| 5 | Créer agents (tdd-guide, code-reviewer, build-resolver) | S | Élevé | 0 |
| 6 | Remplacer alert() par Toast | S | Élevé | 1 |
| 7 | Tests utils (exportMarkdown, transformCriteria...) | M | Élevé | 1 |
| 8 | Durcir CSP (index.html) | S | Élevé | 1 |
| 9 | Dark mode | M | Élevé | 2 |
| 10 | Export PDF Design System | M | Élevé | 2 |
| 11 | Import/Export progression JSON | M | Élevé | 2 |
| 12 | Responsive mobile audit | S | Élevé | 2 |
| 13 | Debounce recherche glossaire | XS | Moyen | 3 |
| 14 | Raccourcis clavier | M | Moyen | 3 |
| 15 | Audit ARIA composants | L | 🔥 Critique | 4 |
| 16 | Handle glossaire accessible | S | Élevé | 4 |
| 17 | Dashboard statistiques | L | Moyen | 3 |
| 18 | Tests composants | L | Élevé | 1 |
| 19 | Virtualisation liste | M | Faible | 5 |

---

## 9. Commandes personnalisées à créer

### `.claude/commands/add-component.md`

```markdown
Crée un nouveau composant React pour Accessipote.
Nom : $ARGUMENTS

1. Crée src/components/$ARGUMENTS.tsx :
   - Props interface explicite en TypeScript strict
   - JSDoc en français sur la fonction et les props
   - Export nommé ET default
   - Accessibilité : aria-label, role, focus management si interactif

2. Crée src/components/$ARGUMENTS.test.tsx :
   - Test de rendu avec les props requises
   - Test du comportement principal
   - Test d'accessibilité basique (role, aria-label présents)

Après création, lancer npm run test pour vérifier que les tests passent.
```

### `.claude/commands/test-coverage.md`

```markdown
Analyse la couverture de tests du projet.

1. Lance : npm run test -- --coverage
2. Analyse les résultats
3. Identifie les 5 fichiers avec la plus faible couverture de branches
4. Pour chaque fichier, propose 2-3 tests à écrire en priorité
5. Estime le gain de couverture si ces tests étaient écrits

Format de sortie : tableau markdown avec fichier, couverture actuelle, tests prioritaires.
```

### `.claude/commands/audit-a11y.md`

```markdown
Audit d'accessibilité du projet Accessipote lui-même (méta-audit).

Parcours src/components/ et vérifie :
1. Boutons icônes sans texte visible → aria-label présent ?
2. Structure de headings logique (h1 → h2 → h3)
3. Formulaires avec labels associés (htmlFor)
4. Éléments interactifs custom → role et tabIndex corrects ?
5. Indicateurs couleur-only → aussi texte ou icône ?
6. Annonces changements d'état → aria-live ou aria-atomic ?
7. Focus visible sur tous les éléments interactifs

Génère un rapport trié par sévérité : critique / important / mineur.
```

### `.claude/commands/pre-commit.md`

```markdown
Vérifie que le code est prêt à être commité.

1. npm run lint → signale toutes les erreurs ESLint
2. npm run build → vérifie les erreurs TypeScript et le build
3. npm run test → tous les tests doivent passer
4. grep -r "console\.log" src/ → aucun console.log en production
5. grep -r "alert\|confirm\(" src/ → aucun alert() ou confirm()
6. Vérifier les TODO/FIXME non documentés

Génère un résumé : ✅ prêt / ❌ blockers à corriger avec les détails.
```

### `.claude/commands/session-save.md`

```markdown
Sauvegarde l'état de la session de travail en cours.
Nom de session : $ARGUMENTS (ex: "dark-mode" ou "toast-system")

Crée .claude/.sessions/[date]-$ARGUMENTS.md avec :
1. Ce qui a été accompli dans cette session
2. Les approches qui ont fonctionné (avec preuves)
3. Les approches qui n'ont PAS fonctionné et pourquoi
4. Les tâches restantes
5. Le contexte nécessaire pour reprendre demain

Pour reprendre : claude --system-prompt "$(cat .claude/.sessions/[fichier].md)"
```

---

## 🎯 Les 5 premières actions — À faire maintenant

1. **Immédiatement :** Créer `CLAUDE.md` à la racine (template section 1.1)
2. **Immédiatement :** Créer `.claude/rules/coding-style.md` et `.claude/rules/testing.md`
3. **Immédiatement :** Ajouter les token settings dans `~/.claude/settings.json`
4. **Session 1 :** `/plan` + `/tdd` pour le système Toast (remplacer les alert())
5. **Session 2 :** Tests pour `exportMarkdown.ts` et `transformCriteria.ts`

---

## 💡 Conseils avancés du Longform Guide

### llms.txt pour la documentation

Si tu consultes la doc RGAA ou WCAG pendant une session :
```
https://accessibilite.numerique.gouv.fr/llms.txt
```
Ce format donne une version optimisée pour les LLMs — moins de tokens, même info.

### Modulariser le code pour les tokens

Le guide longform insiste : **des fichiers de 200-400 lignes** = meilleur taux de réussite au premier essai. Si un composant dépasse 400 lignes, demande à Claude de le découper.

### Ne jamais laisser Claude refactorer sans filet

```bash
# Avant chaque session importante
git add -A && git stash
# Ou mieux
git checkout -b feature/nom-de-la-feature
```

### Le test pass@k pour les features critiques

- `pass@1` (une tentative) → 70% de chances de réussite
- `pass@3` (3 tentatives) → 91% → utilise `/fork` pour tenter 3 approches en parallèle
- Pour les features critiques (sécurité, données) → toujours viser `pass@3`

---

*Document basé sur : [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Shortform Guide + Longform Guide + analyse d'Accessipote*
*Mis à jour : Mars 2026*
