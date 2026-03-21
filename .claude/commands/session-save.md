Sauvegarde l'état de la session de travail en cours.
Nom de session : $ARGUMENTS (ex: "dark-mode" ou "toast-system")

Crée .claude/.sessions/[date]-$ARGUMENTS.md avec :
1. Ce qui a été accompli dans cette session
2. Les approches qui ont fonctionné (avec preuves)
3. Les approches qui n'ont PAS fonctionné et pourquoi
4. Les tâches restantes
5. Le contexte nécessaire pour reprendre demain

Pour reprendre : claude --system-prompt "$(cat .claude/.sessions/[fichier].md)"
