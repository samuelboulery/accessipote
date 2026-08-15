# Description

<!-- Ce que change cette PR, et pourquoi. Si une issue existe, la citer : « Corrige #12 ». -->

## Type de changement

- [ ] Correction de bug
- [ ] Nouvelle fonctionnalité
- [ ] Refactorisation, sans changement de comportement
- [ ] Documentation
- [ ] Outillage ou CI

## Vérifications

- [ ] `pnpm lint` — aucune erreur
- [ ] `pnpm build` — aucune erreur TypeScript
- [ ] `pnpm test:run` — tous les tests passent
- [ ] Les nouveaux comportements sont couverts par des tests

## Accessibilité

<!-- À remplir si la PR touche l'interface. Sinon, indiquer « sans objet ». -->

- [ ] Testé au clavier seul, focus visible tout au long du parcours
- [ ] Aucun statut ni information transmis par la couleur seule
- [ ] Les cibles d'interaction font au moins 44 × 44 px
- [ ] Les tailles de police sont en `rem`

## Points d'attention

- [ ] `src/data/criteria.json` et `src/data/glossary.json` ne sont pas modifiés
- [ ] La CSP de `index.html` n'est pas affaiblie
- [ ] Aucun `console.log`, `alert()` ni `confirm()` ajouté
