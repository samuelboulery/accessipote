---
{
  "id": "T-0019",
  "titre": "Largeur maximale de lecture",
  "colonne": "revue",
  "priorite": "moyenne",
  "tags": [
    "responsive"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-responsive-etats-vides-apercu-grise.md",
  "epic": "T-0016"
}
---

## Contexte

Au-delà de 1400px, rien ne borne la largeur : les paragraphes et le tableau de
synthèse s'étirent jusqu'au bord.

La contrainte à respecter est celle qui a motivé la sortie de la bannière hors
du panneau (commentaire `HomeHero.tsx:24-25`) : `HomeHero` est hors du `<main>`
et les deux blocs doivent rester alignés. La largeur maximale ne se pose donc
pas sur le panneau — qui doit rester à fleur du bord droit, `rounded-l-card` —
mais sur un conteneur interne identique dans les deux, tous deux ayant déjà
`p-6`.

Attention : le wrapper posé dans le `<main>` doit conserver `min-h-0 flex-1
flex-col`, dont `GlossaryScreen` dépend pour sa hauteur.

## Critères d'acceptation

- [ ] À 1600px, le contenu est borné à 1200px et centré
- [ ] La bannière d'accueil et le panneau restent alignés à gauche à toutes les largeurs
- [ ] Le panneau garde son bord droit à fleur et son `rounded-l-card`
- [ ] Le glossaire garde sa hauteur et son défilement interne au-delà de 1100px
