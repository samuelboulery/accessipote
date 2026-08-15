---
{
  "id": "T-0008",
  "titre": "Glossaire plein écran et popover contextuel",
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

Phase 7 du plan, bloc 05 du handoff. Le panneau latéral redimensionnable (300–800px) coupe la
lecture en deux au moment précis où l'utilisateur a besoin des deux. Il se dédouble : une
définition contextuelle au survol d'un terme dans la carte de critère, et une destination plein
écran pour la consultation.

`parseGlossaryHtml.tsx` gère déjà le rendu du HTML du glossaire — le conserver tel quel, ne
restyler que la présentation.

## Critères d'acceptation

- [ ] `GlossaryScreen.tsx` : index alphabétique dans la barre latérale, liste de résultats de
      320px avec compteur, fiche à droite.
- [ ] Le bas de fiche liste les critères qui emploient le terme ; chaque chip bascule le thème
      actif puis met le focus sur le critère.
- [ ] `GlossaryPopover.tsx` : s'ouvre depuis le terme cliqué (`transform-origin` sur le
      déclencheur), pas depuis le centre de l'écran.
- [ ] `parseGlossaryHtml.tsx` est inchangé.
- [ ] `GlossarySidePanel.tsx` et son test sont supprimés ;
      `MIN_PANEL_WIDTH` / `MAX_PANEL_WIDTH` / `DEFAULT_PANEL_WIDTH` sont retirés de `constants.ts`.
