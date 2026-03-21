Vérifie que le code est prêt à être commité.

1. npm run lint → signale toutes les erreurs ESLint
2. npm run build → vérifie les erreurs TypeScript et le build
3. npm run test → tous les tests doivent passer
4. grep -r "console\.log" src/ → aucun console.log en production
5. grep -r "alert\|confirm\(" src/ → aucun alert() ou confirm()
6. Vérifier les TODO/FIXME non documentés

Génère un résumé : pret / blockers à corriger avec les détails.
