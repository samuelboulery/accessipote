---
{
  "id": "T-0020",
  "titre": "États vides en aperçu grisé",
  "colonne": "revue",
  "priorite": "haute",
  "tags": [
    "ux",
    "a11y"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-responsive-etats-vides-apercu-grise.md",
  "epic": "T-0016"
}
---

## Contexte

Sans audit ouvert, les vues Audit et Synthèse n'affichent qu'un `<p>` gris codé
en dur dans `App.tsx` — donc ni testé, ni cohérent avec l'invitation soignée de
l'accueil. Un écran vide doit montrer ce qui va apparaître, pas constater un
manque.

La brique existe déjà : `EmptyState` porte le motif icône + titre + corps +
actions. Rien de nouveau à introduire, ni couleur ni dépendance.

Distinguer « aucun audit n'existe » de « des audits existent mais aucun n'est
ouvert » : proposer « choisir un audit » à quelqu'un qui n'en a aucun est une
impasse, et proposer d'en créer un à qui en a douze ignore son travail.

Un premier essai plaçait derrière le message un aperçu grisé de l'écran à venir
— rail de thèmes et cartes fantômes, anneau vide et jauges. Écarté après recette
visuelle : le filigrane pesait plus lourd que le message qu'il devait servir.

## Critères d'acceptation

- [ ] Les vues Audit et Synthèse sans audit affichent un message et un bouton, pas un simple paragraphe gris
- [ ] Le texte et l'action diffèrent selon qu'il existe déjà des audits ou non (quatre cas)
- [ ] Un audit ouvert sans aucun critère évalué affiche l'état vide de synthèse au lieu d'un tableau de zéros, export masqué
- [ ] La hiérarchie de titres reste correcte sur chaque écran
- [ ] Tests : quatre combinaisons de `NoAuditState`, cas « zéro évalué » de `SummaryTab`
