# ✅ Checklist de déploiement - Push Domain Automation

## 📦 Fichiers créés (tous prêts)

### Backend Core
- [x] `lib/env.ts` - Gestion des variables d'environnement
- [x] `lib/providers/cloudflare.ts` - Wrapper API Cloudflare
- [x] `lib/providers/vercel.ts` - Wrapper API Vercel  
- [x] `lib/domainOrchestrator.ts` - Orchestrateur principal

### API Endpoints
- [x] `app/api/admin/domains/[id]/push-domain/route.ts`
- [x] `app/api/admin/domains/[id]/domain-status/route.ts`

### Frontend
- [x] `app/admin/sites/[id]/DomainsManager.tsx` - UI mise à jour

### Database
- [x] `lib/db/migration-domain-push.sql` - Migration SQL

### Configuration
- [x] `.env.example` - Variables d'environnement documentées

### Documentation & Outils
- [x] `docs/PUSH_DOMAIN_README.md` - README principal
- [x] `docs/PUSH_DOMAIN_SETUP.md` - Guide de configuration
- [x] `scripts/test-push-config.ts` - Script de test

---

## 🚀 Actions à effectuer pour déployer

### 1️⃣ Base de données (OBLIGATOIRE)

```bash
# Dans Supabase SQL Editor
# Copier-coller et exécuter: lib/db/migration-domain-push.sql
```

**Vérification :**
```sql
-- Doit retourner les nouvelles colonnes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'domains' 
  AND column_name IN ('cloudflare_zone_id', 'domain_status', 'vercel_project_id');
```

### 2️⃣ Tokens API (OBLIGATOIRE)

#### Cloudflare
1. Aller sur https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Custom Token
3. Permissions : **Zone:Read** + **DNS:Edit**
4. Copier le token + Account ID

#### Vercel
1. Aller sur https://vercel.com/account/tokens
2. Create → Full Account
3. Copier le token
4. (Optionnel) Récupérer Team ID si team

### 3️⃣ Configuration locale (DEV)

```bash
# Créer .env.local à la racine
cat > .env.local << EOF
# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx
EOF
```

**Vérification :**
```bash
npx ts-node scripts/test-push-config.ts
# Doit afficher : ✅ Configuration complète et fonctionnelle !
```

### 4️⃣ Configuration production (VERCEL)

Dans les settings du projet Foundry sur Vercel :

1. Environment Variables
2. Ajouter :
   - `CLOUDFLARE_API_TOKEN` = `cf_...`
   - `CLOUDFLARE_ACCOUNT_ID` = `...`
   - `VERCEL_TOKEN` = `vercel_...`
   - `VERCEL_TEAM_ID` = `team_...` (optionnel)
3. Scope : Production + Preview + Development
4. Save
5. Redeploy si nécessaire

### 5️⃣ Configurer vercel_project_id (PAR SITE)

Pour chaque site qui utilisera Push Domain :

```sql
-- Trouver le site
SELECT id, name FROM sites WHERE name = 'Mon Site';

-- Configurer le vercel_project_id pour tous ses domaines
UPDATE domains 
SET vercel_project_id = 'prj_xxxxxxxxxxxx'
WHERE site_id = 'uuid-du-site';
```

**Note :** Le `vercel_project_id` se trouve dans l'URL Vercel ou via l'API :
```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects | jq '.projects[] | {name, id}'
```

### 6️⃣ Test end-to-end (RECOMMANDÉ)

1. Lancer le serveur dev : `npm run dev`
2. Aller dans l'admin → Sites → Choisir un site
3. Ajouter un domaine de test (ex: `test-foundry-123.com` que vous possédez)
4. Cliquer sur **"Push Domain"**
5. Vérifier les logs console
6. Suivre le flow dans l'UI

**Attendu :**
- Si domaine nouveau : état `waiting_nameservers` avec affichage des NS
- Si domaine existant sur CF : passage rapide à `live`

---

## 🔍 Vérifications finales

### Checklist avant production

- [ ] Migration SQL exécutée et vérifiée
- [ ] Tokens Cloudflare valides (test-push-config.ts OK)
- [ ] Tokens Vercel valides (test-push-config.ts OK)
- [ ] Variables d'environnement en production (Vercel settings)
- [ ] Au moins un site avec `vercel_project_id` configuré
- [ ] Test end-to-end réussi en dev
- [ ] UI DomainsManager affiche les boutons "Push Domain"
- [ ] Logs console fonctionnent (voir les appels API)

### Vérification de l'UI

Dans l'admin, page d'un site, section Domaines :

- [ ] Les domaines .localhost n'ont PAS de bouton "Push Domain" ✅
- [ ] Les domaines non-localhost ont le bouton "Push Domain" ✅
- [ ] Le statut du domaine s'affiche (badge coloré) ✅
- [ ] Le message d'avertissement apparaît si pas de `vercel_project_id` ✅

### Vérification des endpoints

```bash
# Test push domain (remplacer {domain-id})
curl -X POST http://localhost:3000/api/admin/domains/{domain-id}/push-domain

# Test statut
curl http://localhost:3000/api/admin/domains/{domain-id}/domain-status
```

**Réponse attendue :**
```json
{
  "success": true,
  "status": "pushing",
  "message": "..."
}
```

---

## 🎯 Utilisation quotidienne

### Pour ajouter un nouveau domaine

1. Admin → Sites → [Votre site]
2. Section Domaines → Ajouter un domaine
3. Entrer `monsite.com`
4. Cliquer **"Push Domain"**
5. Suivre les instructions

### États normaux

| État | Ce qu'il faut faire |
|------|-------------------|
| `draft` | Cliquer sur "Push Domain" |
| `pushing` | Attendre (quelques secondes) |
| `waiting_nameservers` | Configurer les NS chez le registrar, puis "Vérifier / Continuer" |
| `dns_configured` | Automatique → passe à `vercel_pending` |
| `vercel_pending` | Attendre propagation DNS (1-5 min), puis "Vérifier / Continuer" |
| `live` | C'est bon ! ✅ |
| `error` | Voir le message d'erreur, corriger, puis "Push Domain" pour retry |

### En cas d'erreur

1. Lire le message d'erreur dans l'UI
2. Consulter les logs console du serveur
3. Vérifier en DB :
   ```sql
   SELECT domain_status, last_step, last_error 
   FROM domains 
   WHERE hostname = 'monsite.com';
   ```
4. Corriger le problème
5. Cliquer sur "Push Domain" pour retry

---

## 📊 Monitoring simple (v1)

### Logs à surveiller

Dans les logs Next.js (dev ou production) :

✅ Logs normaux :
```
[Cloudflare] GET /zones?name=example.com
[Orchestrator] Étape 1: Zone Cloudflare pour example.com
[Cloudflare] Zone créée: abc123 (pending)
[Orchestrator] Domaine abc123 mis à jour: { domain_status: 'waiting_nameservers' }
```

❌ Logs d'erreur à investiguer :
```
[Cloudflare] Erreur API: 6003: Invalid request headers
[Orchestrator] Erreur push domain: Error: Cloudflare API error: ...
```

### Requêtes SQL utiles

```sql
-- Voir tous les domaines en cours de push
SELECT hostname, domain_status, last_step, updated_at
FROM domains
WHERE domain_status NOT IN ('draft', 'live')
ORDER BY updated_at DESC;

-- Voir les erreurs récentes
SELECT hostname, domain_status, last_error, updated_at
FROM domains
WHERE domain_status = 'error'
ORDER BY updated_at DESC
LIMIT 10;

-- Stats générales
SELECT domain_status, COUNT(*) as count
FROM domains
GROUP BY domain_status;
```

---

## 🎉 C'est prêt !

Tous les fichiers sont créés et prêts à être utilisés. 

**Prochaine étape :** Exécuter la migration SQL et configurer les tokens API.

**Documentation complète :** [`docs/PUSH_DOMAIN_SETUP.md`](../docs/PUSH_DOMAIN_SETUP.md)

---

**Foundry Push Domain v1** - Fait avec soin pour simplifier votre vie 🚀✨
