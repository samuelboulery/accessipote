---
{
  "status": "open",
  "title": "Rendre Accessipote présentable en open source + SEO",
  "opened": "2026-08-15",
  "closed": null,
  "commits": []
}
---

# Rendre Accessipote présentable en open source + SEO

## Context

Le dépôt `samuelboulery/accessipote` est techniquement solide mais n'a jamais été
préparé pour être public. Trois problèmes se cumulent :

1. **Il expose l'atelier plutôt que le produit.** 47 des 180 fichiers versionnés sont
   des documents de travail internes : `ovrsee/` (5 plans, 21 tickets, board), `.claude/`
   (agents, règles, rapport TDD, sessions) et `CLAUDE_CODE_PLAN.md` (851 lignes). Un
   visiteur tombe sur le carnet de bord avant de comprendre à quoi sert l'outil.

2. **Le README ment.** Il décrit l'interface d'avant la refonte — « onglets de
   navigation », « panneau latéral glossaire redimensionnable » — alors que l'app a
   depuis une sidebar de 244 px, quatre destinations et une navigation par thème
   (`ThemeRail`). Il annonce 428 tests / 83,42 % de couverture, chiffres périmés. Aucun
   visuel, aucun badge, aucun lien vers la démo, aucune licence.

3. **Le site est invisible.** `<html lang="en">` sur une application entièrement
   française, pas de `meta description`, pas d'Open Graph, pas de `robots.txt`, pas de
   données structurées. Le dépôt GitHub n'a ni description, ni topics, ni LICENSE.

Résultat visé : un dépôt qu'un auditeur accessibilité, une agence ou une DSI peut
ouvrir et comprendre en trente secondes, et une page qui remonte sur « audit RGAA »,
« checklist RGAA 4.1 », « outil audit accessibilité ».

**Décisions déjà prises** : `ovrsee/` et `.claude/` sortent du suivi git ;
`CLAUDE.md` racine reste versionné ; licence **MIT** ; URL de production
**https://accessipote.fr/** ; README en français seul ; captures + GIF de parcours.

**Écarté d'emblée** : l'audit SEO proposait un JSON-LD contenant un `aggregateRating`
de 4,8/5 sur 42 avis. Ces avis n'existent pas. Des données structurées mensongères
exposent à une action manuelle Google. Le JSON-LD n'aura aucune note.

---

## Lot 1 — Nettoyage du dépôt

Travailler sur une branche `chore/repo-open-source` depuis `main`.
`ovrsee/plans/2026-08-15-recette-responsive-seconde-passe.md` est modifié dans l'arbre
de travail : le commiter ou le stasher avant de commencer.

**Sortir du suivi sans supprimer du disque** (`git rm -r --cached`, les fichiers
restent en local) :

- `ovrsee/` — 28 fichiers
- `.claude/` — 18 fichiers (le dossier reste fonctionnel en local)
- `CLAUDE_CODE_PLAN.md` — déjà listé dans `.gitignore` mais versionné malgré tout

Puis étendre `.gitignore` : `ovrsee/`, `.claude/` (avec une exception pour rien —
tout sort), en gardant les entrées existantes.

`CLAUDE.md` racine **reste versionné**. Relire son contenu et retirer ce qui n'a de
sens que pour moi (mentions de subagents personnels, chemins locaux) ; garder les
conventions de code, les pièges connus et l'architecture — c'est de la vraie doc.

**Supprimer** (fichiers morts, scaffolding Vite jamais utilisé) :
- `src/assets/react.svg`
- `public/vite.svg`

**Note sur l'historique** : `git rm --cached` retire les fichiers du HEAD, pas de
l'historique. `ovrsee/` et `.claude/` resteront lisibles dans les commits passés. Les
purger demanderait `git filter-repo` + `push --force`, ce qui réécrit les SHA et casse
les clones existants. Comme rien de sensible n'y figure (pas de secret, pas de donnée
client — à confirmer par une relecture rapide), **je ne réécris pas l'historique** sauf
demande explicite.

---

## Lot 2 — Identité du projet

### `package.json`

Compléter les champs manquants :

```jsonc
"name": "accessipote",              // au lieu de outil-checklist-rgaa
"version": "1.0.0",                 // au lieu de 0.0.0
"private": true,                    // CONSERVÉ — voir ci-dessous
"description": "…",
"keywords": ["rgaa", "rgaa-4-1", "accessibilite", "accessibility", "audit",
             "wcag", "checklist", "a11y", "react", "typescript"],
"homepage": "https://accessipote.fr",
"repository": { "type": "git", "url": "git+https://github.com/samuelboulery/accessipote.git" },
"bugs": { "url": "https://github.com/samuelboulery/accessipote/issues" },
"license": "MIT",
"author": "Samuel Boulery (https://github.com/samuelboulery)",
"engines": { "node": ">=20" }
```

**`private: true` est conservé, contre l'avis de l'audit SEO.** Accessipote est une
application, pas une bibliothèque : personne ne fera `pnpm add accessipote`. Le
champ n'a aucun effet sur la découvrabilité GitHub (qui lit le fichier `LICENSE`, pas
`package.json`) et il empêche une publication npm accidentelle. Le retirer serait un
risque sans contrepartie.

### Fichiers de gouvernance à créer

| Fichier | Contenu |
|---|---|
| `LICENSE` | MIT, © 2025-2026 Samuel Boulery |
| `NOTICE.md` *(ou section dans LICENSE)* | Distinction code MIT / données RGAA — voir ci-dessous |
| `CONTRIBUTING.md` | Prérequis (Node ≥ 20, pnpm 10.12.1), `pnpm install`, workflow TDD, Conventional Commits en français, règle « ne jamais modifier `criteria.json` / `glossary.json` », checklist avant PR (lint + build + tests) |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1, version française |
| `SECURITY.md` | Versions supportées, contact de divulgation, délai de réponse, rappel qu'aucune donnée ne quitte le navigateur |
| `CHANGELOG.md` | Format Keep a Changelog, `1.0.0` reconstitué depuis `git log` |
| `.editorconfig` | UTF-8, LF, indent 2 espaces |
| `.nvmrc` | `22` |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Formulaire : navigateur, mode d'audit, étapes |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Formulaire court |
| `.github/ISSUE_TEMPLATE/config.yml` | Lien vers les Discussions ou la démo |
| `.github/PULL_REQUEST_TEMPLATE.md` | Description, type, checklist de vérification |
| `.github/dependabot.yml` | pnpm hebdomadaire + github-actions |

**Point à vérifier avant d'écrire `NOTICE.md`** : `src/data/criteria.json` et
`glossary.json` proviennent de la DINUM. Le RGAA est publié sous **Licence Ouverte /
Open Licence 2.0 (Etalab)** — à confirmer sur accessibilite.numerique.gouv.fr avant de
l'affirmer dans le dépôt. Formulation cible : *code sous MIT, données RGAA 4.1 ©
DINUM sous Licence Ouverte 2.0*. Une licence approximative sur un projet dont le sujet
est la conformité serait embarrassante.

### CI (`.github/workflows/ci.yml`)

Corrections ciblées, le workflow est globalement bon :

- Retirer `develop` des déclencheurs (la branche n'existe pas).
- `codecov-action@v4` sans `CODECOV_TOKEN` échoue sur les dépôts publics récents :
  soit ajouter le secret, soit passer l'étape en `continue-on-error: true`.
- `pnpm audit --audit-level=high` avec `continue-on-error: false` fait rougir la CI dès
  qu'un avis est publié en amont, sans lien avec la PR. Le passer en job non bloquant
  planifié (`schedule`) plutôt qu'à chaque push.
- Ajouter un job de build du dossier `dist/` déjà présent — il existe, rien à faire.

---

## Lot 3 — README

Réécriture complète en français. **Aucun chiffre recopié** : les compteurs de tests,
la couverture et la taille de bundle sont mesurés au moment de la rédaction
(`pnpm test:run`, `pnpm test:coverage`, `pnpm build` puis mesure gzip), jamais repris
de l'ancien README ni des notes internes qui se contredisent (428 vs 564 tests).

Structure :

1. **En-tête** — logo/titre, accroche d'une ligne, badges (CI, licence MIT, React 19,
   couverture), lien démo `https://accessipote.fr`.
2. **Visuel d'ouverture** — le GIF du parcours (lot 5).
3. **Le problème** — 3-4 lignes : un audit RGAA se fait aujourd'hui dans un tableur,
   106 critères, 13 thèmes, une reprise à chaque itération.
4. **Ce que fait Accessipote** — audits nommés et reprenables, mode figé à la création
   (Classic / Design System), navigation par thème, tests cochables, notes, pages
   concernées, synthèse chiffrée, glossaire de 119 termes, exports Markdown et PDF.
5. **Captures** — accueil, écran d'audit, synthèse, mode sombre.
6. **Démarrage** — `pnpm install` / `pnpm dev`, prérequis Node ≥ 20, pnpm 10.12.1.
7. **Ce qui rend l'outil crédible** — la section qui vend :
   - Zéro backend, zéro compte, zéro tracking : tout reste en `localStorage`,
     `connect-src 'self'` interdit toute requête sortante.
   - Données RGAA officielles, non modifiées.
   - L'outil applique ce qu'il mesure : statut jamais signalé par la couleur seule
     (icône de forme + libellé, `statusPresentation.ts`), cibles tactiles 44 px,
     tailles en `rem` pour le zoom texte (RGAA 10.4), anneaux de focus à double
     contraste, `prefers-reduced-motion` et `prefers-contrast: more` respectés.
   - CSP stricte sans `unsafe-inline` ni `unsafe-eval`, polices auto-hébergées.
8. **Stack** — versions exactes depuis `package.json`.
9. **Architecture** — arborescence `src/` corrigée (les composants cités doivent
   exister : `AuditScreen`, `ThemeRail`, `CriteriaDetail`, `SummaryTab`,
   `GlossaryScreen`, `Sidebar`, `MobileTabBar`…).
10. **Tests et qualité** — chiffres mesurés, commandes.
11. **Contribuer** — renvoi vers `CONTRIBUTING.md`.
12. **Licence** — MIT pour le code, DINUM pour les données.

Le README doit citer naturellement les termes cibles dans les 200 premiers mots :
« audit RGAA 4.1 », « accessibilité numérique », « checklist », « conformité »,
« WCAG 2.1 ». Sans bourrage.

---

## Lot 4 — SEO on-page

### `index.html`

Une constante d'URL unique : `https://accessipote.fr/`. Ajouts, dans l'ordre du `<head>` :

- `<html lang="fr">` — **le correctif le plus rentable du lot**, une ligne.
- `<title>` descriptif : `Accessipote — Audit RGAA 4.1 : checklist d'accessibilité web`
  (sous 60 caractères).
- `<meta name="description">` — 150-160 caractères, avec les termes cibles.
- `<link rel="canonical" href="https://accessipote.fr/">`
- `<meta name="theme-color">` avec deux `media` (clair/sombre) alignés sur
  `--a-bg` de `src/tokens.css`.
- Open Graph : `og:type`, `og:url`, `og:title`, `og:description`, `og:image`
  (+ `og:image:width/height/alt`), `og:locale="fr_FR"`, `og:site_name`.
- Twitter Card : `summary_large_image`.
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` et
  `<link rel="manifest" href="/site.webmanifest">`.
- JSON-LD `WebApplication` : nom, description, `applicationCategory`,
  `operatingSystem: "Web"`, `inLanguage: "fr-FR"`, `offers` à 0 EUR, `author`,
  `license` MIT. **Sans `aggregateRating`.**

**Compatibilité CSP** — point à vérifier en exécution, pas à supposer. La CSP est
`script-src 'self'` sans `unsafe-inline`. Un `<script type="application/ld+json">`
n'est pas exécuté par le navigateur : c'est un bloc de données, hors du périmètre de
`script-src`. Le comportement attendu est donc « pas de blocage ». La vérification est
au lot 7 : si la console signale une violation, le repli est de servir le JSON-LD via
un fichier externe référencé, ou d'ajouter un `sha256` au `script-src`.

### `public/`

| Fichier | Contenu |
|---|---|
| `robots.txt` | `User-agent: *` / `Allow: /` / `Sitemap: https://accessipote.fr/sitemap.xml`. **Pas de `Crawl-delay`** (ignoré par Google, inutile ici) ni de `Disallow: /assets/` (bloquer JS et CSS empêche Google de rendre la SPA — ce serait un contresens). |
| `sitemap.xml` | Une seule URL. Valeur faible mais coût nul. |
| `site.webmanifest` | Nom, `short_name`, `display: standalone`, couleurs issues des jetons. |
| `apple-touch-icon.png` | 180×180, dérivé de `accessibility-icon.svg`. |
| `og-image.png` | 1200×630 — production au lot 5. |

### Le plafond structurel, dit franchement

L'app est une SPA sans routeur : `view` est un `useState` dans `App.tsx`. Il n'existe
donc **qu'une seule URL indexable**. Aucune métadonnée par écran, aucun lien profond,
un sitemap d'une ligne. Les correctifs ci-dessus rendent cette page unique
correctement indexée et correctement partagée — c'est le maximum atteignable sans
changement d'architecture.

Aller plus loin supposerait un routeur plus du prérendu au build, soit une nouvelle
dépendance et une refonte de la navigation. **Hors périmètre de cette demande.** Si
l'objectif devient l'acquisition organique, c'est le sujet suivant, à décider seul.

Je ne peux pas vérifier de volumes de recherche sans outil payant : les termes cibles
retenus viennent du vocabulaire officiel DINUM/W3C, pas d'une mesure.

---

## Lot 5 — Visuels

Via l'automatisation Chrome, sur `pnpm dev` (http://localhost:5173). Un audit de
démonstration est créé à la main dans l'app pour que les captures montrent des données
réalistes plutôt que des états vides.

- `docs/screenshots/accueil.png` — 1440×900
- `docs/screenshots/audit.png` — écran d'audit, un thème ouvert
- `docs/screenshots/synthese.png` — anneau + jauge segmentée renseignés
- `docs/screenshots/sombre.png` — mode sombre
- `docs/parcours.gif` — création d'audit → notation de critères → synthèse.
  Cible **sous 4 Mo** ; au-delà, réduire la durée ou la largeur avant de commiter.
- `public/og-image.png` — 1200×630. Produit en écrivant une page HTML statique
  jetable (logo + titre + accroche, aux jetons de `tokens.css`) capturée à cette
  taille exacte. Aucune dépendance ni outil de design ajouté.

`docs/screenshots/` est versionné : les images doivent s'afficher depuis le README sur
github.com.

---

## Lot 6 — Réglages du dépôt GitHub

Actions sortantes sur le dépôt public, à faire en fin de parcours et à confirmer avant
exécution :

```bash
gh repo edit samuelboulery/accessipote \
  --description "Outil d'audit RGAA 4.1 : checklist interactive de 106 critères d'accessibilité, hors ligne, sans compte, exports Markdown et PDF." \
  --homepage "https://accessipote.fr"

gh repo edit samuelboulery/accessipote \
  --add-topic accessibility --add-topic a11y --add-topic rgaa \
  --add-topic wcag --add-topic audit --add-topic accessibilite \
  --add-topic checklist --add-topic react --add-topic typescript --add-topic france
```

Les topics sont le principal levier de découvrabilité interne à GitHub : sans eux, le
dépôt n'apparaît sur aucune page `github.com/topics/…`.

---

## Fichiers touchés

**Modifiés** : `README.md` (réécriture), `index.html`, `package.json`, `.gitignore`,
`CLAUDE.md` (élagage), `.github/workflows/ci.yml`.

**Créés** : `LICENSE`, `NOTICE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
`SECURITY.md`, `CHANGELOG.md`, `.editorconfig`, `.nvmrc`,
`.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/dependabot.yml`, `public/robots.txt`, `public/sitemap.xml`,
`public/site.webmanifest`, `public/apple-touch-icon.png`, `public/og-image.png`,
`docs/screenshots/*`, `docs/parcours.gif`.

**Retirés du suivi** : `ovrsee/**`, `.claude/**`, `CLAUDE_CODE_PLAN.md`.
**Supprimés** : `src/assets/react.svg`, `public/vite.svg`.

**Jamais touchés** : `src/data/criteria.json`, `src/data/glossary.json`, et toute
logique applicative. Ce chantier ne modifie aucun comportement de l'app hormis les
métadonnées du `<head>`.

---

## Vérification

1. `pnpm lint` — zéro erreur.
2. `pnpm build` — build TypeScript + Vite sans erreur.
3. `pnpm test:run` — tous les tests verts, et **relever le compte exact** pour le README.
4. `pnpm test:coverage` — relever le pourcentage exact pour le README et le badge.
5. `pnpm preview` puis, dans Chrome : console vide de toute violation CSP —
   **c'est le contrôle qui valide le JSON-LD**.
6. Dans la même page servie : `document.documentElement.lang === 'fr'`, présence de la
   `meta description`, des balises `og:*` et du bloc `application/ld+json`.
7. Valider le JSON-LD sur le Rich Results Test de Google (ou le validateur schema.org).
8. `git status` — plus aucun fichier `ovrsee/` ni `.claude/` suivi ; `git ls-files | wc -l`
   doit tomber d'environ 180 à environ 135.
9. Vérifier que les fichiers retirés du suivi **existent toujours sur le disque**.
10. Relire le README rendu sur github.com après push : badges affichés, images
    chargées, GIF lisible, aucun lien mort.
11. `curl -I https://accessipote.fr/robots.txt` après déploiement — l'hébergeur doit
    bien servir les fichiers de `public/`.
12. Confirmer que la licence des données RGAA affirmée dans `NOTICE.md` correspond à
    celle publiée par la DINUM.
