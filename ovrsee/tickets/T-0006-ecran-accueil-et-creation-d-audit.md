---
{
  "id": "T-0006",
  "titre": "Écran accueil et création d'audit",
  "colonne": "pret",
  "priorite": "moyenne",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "ecran",
    "charge:l"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 5 du plan, blocs 01 et 01b du handoff. C'est le premier écran : il rend visible que le
travail est un objet nommé et daté, qu'on peut quitter et reprendre.

L'en-tête actuel (titre 4xl + baseline + boutons) disparaît de tous les écrans ; l'identité se
réduit à une tuile de logo de 32px et au mot-symbole en haut de la barre latérale.

## Critères d'acceptation

- [ ] `HomeScreen.tsx` : liste d'audits avec anneau 48px, nom, méta (mode + date relative),
      pourcentage et ratio en mono, chevron ; action primaire « Démarrer un nouvel audit » ;
      deux raccourcis (glossaire, import).
- [ ] État vide (aucun audit) : liste masquée, titre conservé, sous-titre remplacé par une
      invitation, action primaire seule.
- [ ] `NewAuditForm.tsx` : nom (requis), périmètre marqué « optionnel » dans le `<label>` et pas
      seulement par l'absence d'astérisque, mode de vérification en `<fieldset>`/`<legend>` avec
      deux `<label>` radio, thèmes à auditer en pastilles multi-select avec compteur.
- [ ] L'erreur du champ nom s'affiche **sous le champ, à la sortie du champ**, pas à la
      soumission.
- [ ] Le mode est figé à la création et n'apparaît plus qu'en lecture dans le sélecteur d'audit.
