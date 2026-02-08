# Foundry – Architecture

## Stack technique
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL (Supabase ou Postgres standard)
- Déploiement prévu : Vercel ou serveur dédié derrière Cloudflare

## Philosophie générale
Foundry est une application unique servant plusieurs sites.
Il n’existe jamais “un site = une app”.

La différenciation entre sites se fait uniquement par :
- la base de données
- la configuration
- les templates sélectionnés

## Structure du repository
Le projet est organisé pour séparer clairement :
- UI
- logique métier
- accès aux données
- multi-tenancy

Structure cible :

- /apps
  - /web
    - app/            (App Router)
    - admin/          (back-office)
    - middleware.ts
    - styles/
- /packages
  - /core             (multi-tenant, résolution site, guards)
  - /db               (schema SQL, queries, migrations)
  - /ui               (composants UI partagés)
- /docs               (fichiers .md de spécification)

Cette structure peut être simplifiée au début mais doit rester conceptuellement respectée.

## App Router
- Toutes les pages publiques passent par App Router
- Les Server Components sont privilégiés
- Les appels DB se font côté serveur uniquement
- Les routes API servent aux mutations (admin, IA, jobs)

## Multi-tenancy
- Le site courant est résolu au début de chaque requête
- Le `site_id` est injecté dans le contexte serveur
- Aucun composant ne doit ignorer le `site_id`

## Cache
- Cache applicatif court pour la résolution domaine → site
- ISR ou SSR selon le type de page
- Revalidation à la publication

## Environnements
- Local : domaines simulés via *.localhost
- Production : domaines réels derrière Cloudflare

## Règles importantes
- Aucune logique métier dans les composants UI
- Aucun accès DB direct depuis le client
- Toute nouvelle feature doit être pensée multi-site dès le départ
