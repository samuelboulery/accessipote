---
{
  "id": "T-0017",
  "titre": "Seuil wide au lieu des breakpoints fenêtre",
  "colonne": "revue",
  "priorite": "haute",
  "tags": [
    "responsive",
    "tailwind"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-responsive-etats-vides-apercu-grise.md",
  "epic": "T-0016"
}
---

## Contexte

`tailwind.config.js` ne déclare pas de clé `screens` : l'app hérite des seuils
par défaut. Or `lg:` vaut 1024px de fenêtre, soit 732px de contenu réel une fois
retirés la sidebar et le padding — trop peu pour deux colonnes. `CriteriaDetail`
s'y retrouve avec une colonne principale de 350px face à un panneau de 380px.

On déclare `screens` explicitement, dans l'esprit du reste du fichier où les
échelles sont remplacées et non étendues. `lg` disparaît : les six classes qui
l'utilisent sont réécrites, et son absence empêche d'en réintroduire par
réflexe.

## Critères d'acceptation

- [ ] `tailwind.config.js` déclare `screens: { sm: 640px, wide: 1100px, xl: 1280px }`, commenté par le calcul de la zone de contenu
- [ ] Plus aucune occurrence de `lg:` dans `src/`
- [ ] `CriteriaDetail`, `GlossaryScreen`, `SummaryTab` et `HomeHero` basculent en deux colonnes à 1100px et pas avant
- [ ] `HomeScreen` garde son passage à deux colonnes en `xl`
- [ ] À 900px de fenêtre, détail de critère et glossaire tiennent en une seule colonne
