# Extension Accessipote — sources

**Ne pas charger ce dossier dans Chrome.** Il contient les sources : son
`popup.html` référence un fichier `.ts` que le navigateur ne sait pas exécuter,
et il n'a volontairement pas de `manifest.json` — Chrome refusera le dossier,
plutôt que d'ouvrir un popup inerte.

Le dossier à charger est `dist-extension/`, produit par le build :

```bash
pnpm build:extension
```

Puis dans Chrome : `chrome://extensions` → mode développeur → « Charger
l'extension non empaquetée » → choisir `dist-extension/`.

Après chaque `pnpm build:extension`, recharger l'extension depuis
`chrome://extensions` pour prendre le nouveau code.

## Ce que fait l'extension

Elle récolte, et rien d'autre. Le mapping RGAA, l'agrégation et les verdicts
vivent dans `src/scan/`, partagés avec la CLI `pnpm scan` : il n'y a qu'une
seule source de vérité. La validation, le tri par certitude et l'écriture
restent dans l'application, qui revalide le rapport reçu comme elle validerait
un fichier déposé.

Aucune donnée ne quitte le poste : l'extension ne fait aucune requête réseau.
