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
