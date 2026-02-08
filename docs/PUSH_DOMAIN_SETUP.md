# Guide de mise en place - Push Domain Automation

## Vue d'ensemble

Le système Push Domain automatise la configuration complète d'un domaine :
- Création de zone Cloudflare
- Configuration DNS pour Vercel
- Ajout du domaine sur Vercel
- Validation automatique

## 1. Migration de la base de données

Exécutez la migration SQL pour ajouter les colonnes nécessaires :

```sql
-- Dans Supabase SQL Editor
-- Copier et exécuter le contenu de: lib/db/migration-domain-push.sql
```

Cette migration ajoute à la table `domains` :
- `cloudflare_zone_id` : ID de la zone Cloudflare
- `vercel_project_id` : ID du projet Vercel
- `domain_status` : État dans la state machine
- `last_step` : Dernière étape tentée
- `last_error` : Message d'erreur si échec
- `nameservers` : NS Cloudflare à configurer
- `push_started_at` / `push_completed_at` : Timestamps

## 2. Configuration des tokens API

### 2.1 Token Cloudflare

1. Aller sur https://dash.cloudflare.com/profile/api-tokens
2. Cliquer sur "Create Token"
3. Choisir "Custom token"
4. Permissions minimales :
   - **Zone** : Read
   - **DNS** : Edit
5. Resources : "All zones in account" (ou limiter selon besoin)
6. Copier le token généré

### 2.2 Account ID Cloudflare

Visible dans le dashboard Cloudflare (sidebar droite sur n'importe quelle zone).

### 2.3 Token Vercel

1. Aller sur https://vercel.com/account/tokens
2. Cliquer sur "Create"
3. Nommer le token (ex: "Foundry Domain Push")
4. Scope : Full Account
5. Copier le token généré

### 2.4 Team ID Vercel (optionnel)

Si vos projets sont dans une Team :
1. Settings de la team
2. L'URL contient le Team ID : `vercel.com/teams/{TEAM_ID}`

## 3. Variables d'environnement

### En développement (`.env.local`)

Créer `.env.local` à la racine :

```env
# Supabase (déjà existant normalement)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx
```

**Important** : `.env.local` est déjà dans `.gitignore`, ne jamais le commiter.

### En production (Vercel)

1. Aller dans les Settings du projet Foundry sur Vercel
2. Environment Variables
3. Ajouter les 4 variables :
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VERCEL_TOKEN`
   - `VERCEL_TEAM_ID` (optionnel)
4. Sélectionner : Production, Preview, Development
5. Redéployer si nécessaire

## 4. Configuration dans l'admin Foundry

### 4.1 Ajouter le Vercel Project ID

Pour chaque site, vous devez renseigner le `vercel_project_id` en base de données.

**Option 1 : Manuellement via Supabase**

```sql
UPDATE domains 
SET vercel_project_id = 'prj_xxxxxxxxxxxx'
WHERE site_id = 'votre-site-uuid';
```

**Option 2 : Via l'API Vercel**

Pour trouver votre project ID :
```bash
curl -H "Authorization: Bearer VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects
```

**TODO pour v1.1** : Ajouter un champ dans l'UI des settings du site pour configurer le `vercel_project_id`.

## 5. Utilisation du Push Domain

### Interface utilisateur

Dans l'admin, page d'un site → Section Domaines :

1. **Ajouter un domaine** (ex: `monsite.com`)
2. Cliquer sur le bouton **"Push Domain"**
3. Le système démarre l'orchestration automatique

### États possibles

| État | Description | Action utilisateur |
|------|-------------|-------------------|
| `draft` | Domaine créé mais pas encore poussé | Cliquer sur "Push Domain" |
| `pushing` | Orchestration en cours | Attendre |
| `waiting_nameservers` | Zone créée, NS à configurer chez le registrar | Configurer les NS puis "Vérifier / Continuer" |
| `dns_configured` | DNS configurés | Automatique → `vercel_pending` |
| `vercel_pending` | En attente validation Vercel | Cliquer sur "Vérifier / Continuer" |
| `live` | Tout est OK, domaine actif | Rien à faire |
| `error` | Erreur survenue | Voir le message d'erreur, puis "Push Domain" pour retry |

### Flow typique

**Cas 1 : Domaine déjà sur Cloudflare**
1. Push Domain → récupère la zone existante
2. Configure DNS automatiquement
3. Ajoute à Vercel
4. Validation (quelques secondes à minutes)
5. `live` ✅

**Cas 2 : Nouveau domaine**
1. Push Domain → crée la zone Cloudflare
2. Affiche les nameservers à configurer
3. **Utilisateur** : configure les NS chez le registrar
4. Cliquer sur "Vérifier / Continuer"
5. Dès que les NS sont propagés → continue automatiquement
6. Configure DNS → Ajoute à Vercel → Validation
7. `live` ✅

## 6. Polling et vérification

Pas de webhooks dans v1, donc :

- **waiting_nameservers** : L'utilisateur doit cliquer sur "Vérifier / Continuer" après avoir configuré les NS
- **vercel_pending** : L'utilisateur peut cliquer sur "Vérifier / Continuer" pour forcer une vérification

Le système vérifie à chaque clic si l'étape est prête et continue automatiquement.

## 7. Idempotence

Le système est **idempotent** : vous pouvez relancer un push à tout moment.

- Si zone Cloudflare existe → récupère au lieu de créer
- Si DNS records existent → met à jour au lieu de dupliquer
- Si domaine Vercel existe → récupère le statut
- Si erreur → corrigez et retry sans tout casser

## 8. Debugging

### Logs côté serveur

Tous les appels API sont loggés dans la console :
```
[Cloudflare] GET /zones/...
[Vercel] POST /projects/.../domains
[Orchestrator] Étape 1: Zone Cloudflare pour example.com
```

### Erreurs communes

**"CLOUDFLARE_API_TOKEN non configuré"**
→ Variables d'environnement manquantes, vérifier `.env.local` ou Vercel settings

**"Cloudflare API error: 6003: Invalid request headers"**
→ Token Cloudflare invalide

**"Vercel API error: Forbidden"**
→ Token Vercel invalide ou permissions insuffisantes

**"vercel_project_id manquant dans la DB"**
→ Le domaine n'a pas de `vercel_project_id` configuré

**"Zone déjà présente sur un autre compte"**
→ Le domaine est déjà sur un autre compte Cloudflare, impossible de le gérer

### Colonnes DB pour debug

Consulter directement dans Supabase :
```sql
SELECT 
  hostname, 
  domain_status, 
  last_step, 
  last_error,
  cloudflare_zone_id,
  nameservers
FROM domains
WHERE id = 'domain-uuid';
```

## 9. Limitations v1

- ❌ Pas de webhooks (polling manuel via UI)
- ❌ Pas de queue background (BullMQ/Inngest)
- ❌ Pas de logging avancé (uniquement console + DB)
- ❌ Pas de gestion multi-organisations (1 compte CF + 1 compte Vercel)
- ❌ `vercel_project_id` doit être configuré manuellement en DB

## 10. Évolutions futures (v2+)

- [ ] Webhooks Cloudflare/Vercel pour validation automatique
- [ ] Queue système pour gérer les retry et polling automatique
- [ ] Champ `vercel_project_id` dans les settings du site (UI)
- [ ] Multi-organisations avec tokens par site/org
- [ ] Logs structurés (Sentry, Datadog, etc.)
- [ ] Support SSL personnalisé
- [ ] Gestion avancée des DNS (records custom)

## Support

En cas de problème :
1. Vérifier les logs console du serveur Next.js
2. Vérifier les colonnes `last_step` et `last_error` en DB
3. Consulter la documentation Cloudflare/Vercel API
4. Retry après avoir corrigé le problème

---

**Foundry v1 - Push Domain Automation** ✨
