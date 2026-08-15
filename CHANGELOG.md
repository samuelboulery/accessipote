# Journal des modifications

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet applique le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Licence MIT, `NOTICE.md` distinguant le code des données RGAA, guide de
  contribution, politique de sécurité et code de conduite.
- Métadonnées d'indexation et de partage : description, canonical, Open Graph,
  Twitter Card, données structurées `WebApplication`, `robots.txt`, plan de
  site et manifeste web.
- Captures d'écran et démonstration animée dans le README.

### Corrigé

- `index.html` déclarait `lang="en"` sur une application entièrement française.

### Modifié

- README réécrit : il décrivait encore l'interface d'avant la refonte et
  annonçait des chiffres de tests périmés.

### Retiré

- Documents de travail internes et scaffolding Vite inutilisé sortis du dépôt.

## [1.0.0] — 2026-08-15

Première version présentable de l'outil, à l'issue de la refonte de
l'interface.

### Ajouté

- **Audits nommés.** Un audit se crée, se date, se reprend et se supprime. Le
  mode — Classique ou Design System — est figé à la création.
- **Navigation en quatre destinations** : Accueil, Audit, Synthèse, Glossaire.
  L'audit se parcourt un thème à la fois : le thème est la navigation, pas un
  filtre.
- **Saisie par critère** : statut, tests cochables, notes libres et liste des
  pages concernées.
- **Synthèse chiffrée** : taux de conformité, anneau de progression, jauge
  segmentée par statut et tableau par thème.
- **Glossaire** de 119 entrées, consultable en plein écran ou en popover depuis
  un terme d'un critère.
- **Exports** Markdown (presse-papiers, avec repli en téléchargement) et PDF.
- **Mode sombre** et interface utilisable du téléphone au grand écran.
- **Raccourcis clavier** et modale d'aide associée.
- Migration automatique des données de la version 1 vers le modèle d'audits
  nommés, sans jamais réécrire l'ancienne clé de stockage.

### Sécurité

- Politique de sécurité de contenu stricte, sans `unsafe-inline` ni
  `unsafe-eval`.
- Polices auto-hébergées : aucune requête vers un service tiers.
- Assainissement du HTML du glossaire par DOMPurify.
