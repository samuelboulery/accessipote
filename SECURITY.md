# Politique de sécurité

## Surface d'attaque

Accessipote est une application entièrement cliente. Il n'y a **pas de serveur,
pas de base de données, pas de compte utilisateur et aucun appel réseau
sortant** : la directive `connect-src 'self'` de la politique de sécurité de
contenu interdit toute requête vers un tiers.

Les données d'audit — noms, notes, URL des pages auditées — restent dans le
`localStorage` du navigateur. Elles ne transitent nulle part et personne d'autre
que l'utilisateur n'y a accès. Une faille dans Accessipote ne peut donc pas
exposer les données d'un tiers, ce qui réduit beaucoup la gravité possible d'un
problème, sans la rendre nulle.

Restent pertinents : injection de script via un contenu importé, contournement
de l'assainissement du glossaire, ou affaiblissement de la CSP.

## Versions supportées

Seule la dernière version publiée sur la branche `main` reçoit des correctifs.

## Signaler une faille

**N'ouvre pas d'issue publique.**

Utilise l'avis de sécurité privé de GitHub :
<https://github.com/samuelboulery/accessipote/security/advisories/new>

Décris le problème, les étapes pour le reproduire et l'impact que tu estimes.
Une preuve de concept aide beaucoup.

Réponse sous **7 jours**. Si le problème est confirmé, on convient ensemble
d'une date de divulgation, et tu es crédité dans le correctif sauf demande
contraire de ta part.

## Ce qui n'est pas une faille

- Le fait que les données d'audit soient lisibles dans le `localStorage` par
  quelqu'un qui a déjà la main sur la machine et le navigateur de
  l'utilisateur. C'est le modèle de stockage assumé, documenté, et il n'y a
  aucune donnée d'authentification à protéger.
- Un rapport de scanner automatique sans démonstration d'exploitation.
