# Sécurité — Accessipote

## Règles absolues

- Jamais de secrets hardcodés (clés API, tokens) dans le code source
- Jamais de `eval()` ou `new Function()` — vecteur XSS
- Jamais de `dangerouslySetInnerHTML` sans sanitisation explicite
- Toujours valider les données importées (JSON d'audit) avant de les restaurer

## Content Security Policy

La CSP dans `index.html` est stricte — aucune directive permissive :

```
default-src 'self';
script-src 'self';                              -- React 19 + Vite ne génèrent pas de code inline
style-src 'self' https://fonts.googleapis.com; -- Tailwind CSS (fichier externe) + Google Fonts
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: blob:;                    -- blob: pour les exports PDF jsPDF
connect-src 'self';
base-uri 'self';
form-action 'self';
object-src 'none';                             -- bloque les plugins legacy
upgrade-insecure-requests;
```

Ne jamais réintroduire :
- `'unsafe-eval'` — vecteur XSS, inutile avec React 19
- `'unsafe-inline'` — utiliser des classes CSS externes à la place des `style={{}}`

Si un composant nécessite un style inline, l'extraire dans `src/index.css`.

## Validation des entrées

- Valider le schéma JSON avant tout import dans `useLocalStorage.ts`
- Afficher un message d'erreur via le composant Toast (jamais `alert()`)
- Ne jamais faire confiance aux données localStorage sans vérification de type

## localStorage

- Le schéma est défini dans `useLocalStorage.ts` — ne pas le contourner
- Toute modification de schéma doit passer par la logique de migration existante
- Ne pas stocker d'informations sensibles en localStorage

## Checklist avant commit

- [ ] Aucun `console.log` (détecté automatiquement par le hook PostToolUse)
- [ ] Aucun `alert()` ou `confirm()` dans le code source
- [ ] Aucune donnée non validée lue depuis localStorage ou un fichier importé
- [ ] CSP non dégradée par rapport à l'état précédent
