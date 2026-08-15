# Contribuer à Accessipote

Merci de l'intérêt que tu portes au projet. Ce document dit comment monter
l'environnement, ce qu'on attend d'une contribution, et les quelques règles qui
ne se négocient pas.

## Avant d'écrire du code

**Ouvre une issue d'abord.** Une pull request qui arrive sans discussion
préalable a de bonnes chances d'être refusée pour une raison de direction
produit, ce qui gâche ton temps. Une issue de trois lignes suffit à éviter ça.

Pour un bug, l'issue est directement la bienvenue : plus il y a de détails sur
le navigateur, le mode d'audit et les étapes, plus vite c'est corrigé.

## Monter l'environnement

Prérequis : **Node 20 ou plus** (la CI teste 20 et 22) et **pnpm**, dont la
version est figée par le champ `packageManager` de `package.json`.

```bash
corepack enable          # fait respecter la version de pnpm déclarée
pnpm install
pnpm dev                 # http://localhost:5173
```

`pnpm` est le seul gestionnaire accepté. Un dépôt qui contiendrait un
`package-lock.json` ou un `yarn.lock` serait à corriger, pas à fusionner.

## Les commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Vérification TypeScript puis build de production |
| `pnpm test` | Vitest en mode surveillance |
| `pnpm test:run` | Tous les tests, une fois (ce que fait la CI) |
| `pnpm test:coverage` | Rapport de couverture |
| `pnpm lint` | ESLint |
| `pnpm scrape:wcag` | Régénère `src/data/wcag-anchors.json` depuis le W3C |

## Écrire le code

**Les tests d'abord.** Le projet suit un cycle rouge / vert / refactor. Une
pull request qui ajoute un comportement sans test associé sera renvoyée pour
complément. La couverture est à 86 % et ne doit pas baisser.

**TypeScript strict, sans `any`.** Si un `any` est réellement inévitable, il
doit être accompagné d'un commentaire qui explique pourquoi.

**Immutabilité.** Jamais de mutation en place d'un objet ou d'un tableau :
on construit une nouvelle valeur.

**Fichiers courts.** 200 à 400 lignes est la cible, 800 le plafond. Au-delà,
c'est un signe qu'il faut découper.

**Pas de `console.log`, pas de `alert()`, pas de `confirm()`.** Les
notifications passent par le composant `Toast`.

**Les chaînes visibles sont en français.** Le code et les identifiants restent
en anglais.

**Pas d'emoji** dans le code ni dans les commentaires.

## Accessibilité : la barre est plus haute qu'ailleurs

Accessipote est un outil d'audit d'accessibilité. Une régression
d'accessibilité dans cet outil n'est pas un bug ordinaire, c'est une
contradiction. Concrètement, pour toute contribution qui touche l'interface :

- Un statut n'est **jamais** signalé par la couleur seule. Chaque statut porte
  une icône de forme distincte et un libellé. La source unique est
  `src/utils/statusPresentation.ts`.
- Toute cible d'interaction fait au moins 44 × 44 px. Un contrôle de 40 px porte
  la classe `target-44`, qui étend la zone cliquable par un pseudo-élément. Un
  `<input>` ne pouvant pas porter de pseudo-élément passe directement à 44 px.
- Les tailles de police sont en `rem`, jamais en `px` : le zoom texte du
  navigateur doit agir dessus (RGAA 10.4).
- La navigation au clavier doit rester complète, et le focus visible.
- `prefers-reduced-motion` et `prefers-contrast: more` doivent continuer d'être
  respectés.

Vérifie ton changement au clavier seul avant de proposer la PR.

## Ce qu'il ne faut jamais toucher

- **`src/data/criteria.json` et `src/data/glossary.json`.** Ce sont les données
  officielles du RGAA, reprises sans modification. Voir [NOTICE.md](./NOTICE.md).
- **`localStorage['rgaa-progress']`.** C'est le stock de la version 1, en
  lecture seule : il sert à la migration et ne doit jamais être réécrit ni
  supprimé.
- **La CSP de `index.html`.** Elle ne contient ni `unsafe-inline` ni
  `unsafe-eval` et doit le rester. Si un composant réclame un style en ligne,
  la réponse est de l'extraire dans une classe CSS.

## L'échelle Tailwind

L'échelle Tailwind par défaut est **remplacée** par celle du design :
`text-sm`, `rounded-lg`, `p-5` ou `text-gray-600` n'existent plus. Une classe
hors système ne produit aucun style. C'est volontaire : ça rend les dérives
visibles immédiatement. Les jetons sont dans `src/tokens.css` et
`tailwind.config.js`.

## Commits et pull requests

Les commits suivent la convention *Conventional Commits*, **rédigés en
français** :

```
feat: ajouter l'export CSV de la synthèse
fix: corriger le compteur de critères non applicables
test: couvrir les cas limites de exportMarkdown
docs: préciser la licence des données RGAA
```

Types utilisés : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`,
`ci`.

Une branche par sujet, nommée `feature/<sujet>` ou `fix/<sujet>`.

Avant d'ouvrir la pull request :

```bash
pnpm lint        # zéro erreur
pnpm build       # zéro erreur TypeScript
pnpm test:run    # tout au vert
```

## Signaler une faille

Ne passe pas par une issue publique : voir [SECURITY.md](./SECURITY.md).
