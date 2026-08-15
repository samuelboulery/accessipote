---
{
  "id": "T-0002",
  "titre": "Fondations visuelles — jetons et polices",
  "colonne": "en-cours",
  "priorite": "haute",
  "epic": "T-0001",
  "tags": [
    "refonte",
    "charge:m"
  ],
  "cree": "2026-08-15",
  "maj": "2026-08-15",
  "plan": "2026-08-15-refonte-accessipote-direction-retenue-handoff-design.md"
}
---

## Contexte

Phase 1 du plan. Rien ne peut être restylé tant que les jetons et l'échelle Tailwind ne sont pas
en place. Le remplacement des échelles Tailwind par défaut est volontairement cassant : il fait
échouer la compilation partout où une classe hors système subsiste, et cette liste d'échecs sert
de carte pour les phases suivantes.

La CSP de `index.html` interdit `font-src` externe : les polices doivent être auto-hébergées en
`.woff2` dans `public/fonts/`, comme Chelsea Market aujourd'hui. Jamais de CDN Google Fonts.

## Critères d'acceptation

- [ ] `tokens.css` du handoff est dans `src/` et importé.
- [ ] `tailwind.config.js` du handoff est fusionné : `text-sm`, `rounded-lg`, `p-5`,
      `text-gray-600` n'existent plus.
- [ ] Instrument Sans (400/500/600/700) et JetBrains Mono (400/500/600) sont en `.woff2` dans
      `public/fonts/`, déclarées en `@font-face` dans `index.css`.
- [ ] Chelsea Market et l'utilitaire `.font-chelsea-market` sont retirés.
- [ ] La CSP de `index.html` est inchangée et `devCspPlugin` de `vite.config.ts` est intact.
