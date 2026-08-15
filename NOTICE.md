# Mentions et licences des données

Accessipote combine deux briques aux licences différentes. Cette distinction
compte : le code est à moi, le référentiel ne l'est pas.

## Le code — Licence MIT

Tout ce qui se trouve dans ce dépôt hors des fichiers listés ci-dessous est
publié sous licence MIT, © 2025-2026 Samuel Boulery. Voir [LICENSE](./LICENSE).

## Les données RGAA — Licence Ouverte / Open Licence 2.0

Les fichiers suivants reproduisent le contenu du **Référentiel général
d'amélioration de l'accessibilité (RGAA) version 4.1**, publié par la Direction
interministérielle du numérique (DINUM) :

| Fichier | Contenu |
|---|---|
| `src/data/criteria.json` | Les 106 critères, leurs tests et leurs références WCAG |
| `src/data/glossary.json` | Les 119 entrées du glossaire |

Ces contenus sont diffusés par la DINUM sous **Licence Ouverte / Open Licence
version 2.0** (Etalab), qui autorise la réutilisation, y compris commerciale, à
condition de mentionner la source et la date de dernière mise à jour.

- Source : <https://accessibilite.numerique.gouv.fr/>
- Dépôt d'origine : <https://github.com/DISIC/accessibilite.numerique.gouv.fr>
- Texte de la licence : <https://www.etalab.gouv.fr/licence-ouverte-open-licence/>

Ces fichiers sont repris **sans modification**. C'est une règle du projet, pas
une précaution de circonstance : un outil d'audit qui altérerait le référentiel
qu'il prétend mesurer ne vaudrait rien. Toute contribution qui les toucherait
sera refusée.

## Les références WCAG

`src/data/wcag-anchors.json` est généré par `pnpm scrape:wcag` à partir de la
traduction française des *Web Content Accessibility Guidelines 2.1* du W3C.
Les WCAG sont publiées sous
[licence W3C Document](https://www.w3.org/copyright/document-license/),
© W3C.

## Les polices

`public/fonts/` contient Instrument Sans et JetBrains Mono, toutes deux sous
[SIL Open Font License 1.1](https://openfontlicense.org/). Elles sont
auto-hébergées : aucune requête n'est faite vers un service tiers.
