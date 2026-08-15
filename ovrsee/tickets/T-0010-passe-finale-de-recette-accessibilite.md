---
{
  "id": "T-0010",
  "titre": "Passe finale de recette accessibilité",
  "colonne": "pret",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "a11y",
    "recette",
    "charge:m"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 9 du plan. La recette formelle contre la checklist « Critères de recette » du README du
handoff, une fois tous les écrans en place. C'est ce ticket qui décide si la refonte est
livrable.

## Critères d'acceptation

- [ ] Un utilisateur avec des données v1 les retrouve dans un audit nommé.
- [ ] Aucune information n'est portée par la seule couleur, sur aucun écran.
- [ ] Chaque jauge multi-segments a 2px de séparation ; chaque donut, 4px d'arc.
- [ ] Tous les compteurs d'un même écran concordent.
- [ ] Toute cible interactive fait au moins 44×44, et 48×48 en mobile.
- [ ] Le focus est visible sur les deux thèmes, sur toutes les surfaces ; aucun `outline: none`
      sans remplacement.
- [ ] Aucune taille de police en demi-pixel ; 8 pas au total.
- [ ] Aucun gris de texte hors `--a-ink` / `--a-ink-muted`.
- [ ] Rayons parent/enfant concentriques partout où un coin en touche un autre.
- [ ] `prefers-reduced-motion` supprime tout déplacement.
- [ ] Zoom à 200 % : aucun contenu perdu, aucun défilement horizontal.
- [ ] Navigation clavier complète, ordre de tabulation = ordre visuel.
- [ ] Lecteur d'écran vérifié sur la synthèse.
- [ ] Les tests de `calculateSummaryStats`, `exportMarkdown`, `useProgress` et
      `transformCriteria` passent sans modification.
