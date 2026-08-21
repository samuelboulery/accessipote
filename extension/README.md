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

## Le panier d'échantillon

Un scan ne porte pas sur une page mais sur un échantillon : un non applicable ne
vaut que si le support manque à **toutes** les pages envoyées. Le popup ajoute
donc chaque page scannée à un panier, qui vit dans `chrome.storage.local` et
survit à la navigation comme à la fermeture du popup. L'auditeur navigue —
y compris derrière une connexion, là où aucun crawl ne va — retire ce qui n'a
rien à y faire, puis envoie le lot d'un coup. L'agrégation se fait à l'envoi,
sur l'échantillon entier.

Le panier n'est pas vidé après l'envoi : le renvoyer vers un autre audit reste
possible. « Vider le panier » est explicite.

## Le scan de zone

« Ajouter une zone… » met la page en mode choix : l'élément survolé se souligne,
un clic le retient, `Échap` annule. Le scan ne porte alors que sur cet élément et
sa descendance.

Un piège vient avec, et il est traité à trois endroits : l'absence d'un support
dans une zone ne prouve plus rien pour le site. Tout non applicable issu d'un lot
qui contient au moins une zone est donc dégradé en « à vérifier » — par le popup
pour que son décompte soit honnête, et par l'application à la réception, qui ne
croit aucun outil sur parole.

Ce geste vit dans le service worker (`background.ts`) et non dans le popup :
cliquer dans la page ferme le popup de Chrome. Le badge de l'icône rend compte
du panier tant qu'aucune fenêtre n'est ouverte pour le faire.

## Ce que fait l'extension

Elle récolte, et rien d'autre. Le mapping RGAA, l'agrégation et les verdicts
vivent dans `src/scan/`, partagés avec la CLI `pnpm scan` : il n'y a qu'une
seule source de vérité. La validation, le tri par certitude et l'écriture
restent dans l'application, qui revalide le rapport reçu comme elle validerait
un fichier déposé.

Aucune donnée ne quitte le poste : l'extension ne fait aucune requête réseau.
