# 🚀 Push Domain Automation - Foundry v1

Système d'automatisation complète pour configurer un domaine avec Cloudflare + Vercel en un clic.

## 📋 Fichiers créés

### Backend
- **`lib/env.ts`** - Gestion centralisée des variables d'environnement
- **`lib/providers/cloudflare.ts`** - Wrapper API Cloudflare (zones, DNS)
- **`lib/providers/vercel.ts`** - Wrapper API Vercel (domaines)
- **`lib/domainOrchestrator.ts`** - Orchestrateur principal (state machine)

### API Routes
- **`app/api/admin/domains/[id]/push-domain/route.ts`** - POST pour lancer le push
- **`app/api/admin/domains/[id]/domain-status/route.ts`** - GET pour récupérer le statut

### Frontend
- **`app/admin/sites/[id]/DomainsManager.tsx`** - UI mise à jour avec boutons Push Domain

### Base de données
- **`lib/db/migration-domain-push.sql`** - Migration pour ajouter les colonnes

### Documentation
- **`docs/PUSH_DOMAIN_SETUP.md`** - Guide complet de mise en place
- **`scripts/test-push-config.ts`** - Script de test de configuration

### Configuration
- **`.env.example`** - Variables d'environnement à configurer

## 🎯 Fonctionnalités

✅ **Automatisation complète**
- Création/récupération de zone Cloudflare
- Configuration DNS pour Vercel
- Ajout du domaine sur Vercel
- Validation et mise en live

✅ **State machine robuste**
- 7 états : draft → pushing → waiting_nameservers → dns_configured → vercel_pending → live / error
- Idempotent : relançable à tout moment
- Reprise depuis l'état actuel

✅ **Polling manuel (v1)**
- Pas de webhooks
- Utilisateur clique sur "Vérifier / Continuer"
- Adapté pour un usage interne

✅ **Gestion d'erreurs**
- Messages clairs dans l'UI
- Logs en DB (`last_error`, `last_step`)
- Retry possible depuis l'état error

## 🔧 Installation rapide

### 1. Exécuter la migration SQL

```bash
# Dans Supabase SQL Editor
# Copier-coller le contenu de: lib/db/migration-domain-push.sql
```

### 2. Configurer les tokens

Créer `.env.local` à la racine :

```env
# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx  # optionnel
```

Voir [`docs/PUSH_DOMAIN_SETUP.md`](./PUSH_DOMAIN_SETUP.md) pour les détails.

### 3. Tester la configuration

```bash
npx ts-node scripts/test-push-config.ts
```

Doit afficher :
```
✅ Token Cloudflare valide
✅ Token Vercel valide
✨ Configuration complète et fonctionnelle !
```

### 4. Configurer le vercel_project_id

Pour chaque site, ajouter le `vercel_project_id` en DB :

```sql
UPDATE domains 
SET vercel_project_id = 'prj_xxxxxxxxxxxx'
WHERE site_id = 'votre-site-uuid';
```

## 📖 Utilisation

### Dans l'admin Foundry

1. Aller sur un site
2. Section "Domaines"
3. Ajouter un domaine (ex: `monsite.com`)
4. Cliquer sur **"Push Domain"**
5. Suivre les instructions à l'écran

### Flow typique

**Domaine déjà sur Cloudflare :**
```
Push Domain → DNS configurés → Ajout Vercel → Validation → Live ✅
(~30 secondes à 2 minutes)
```

**Nouveau domaine :**
```
Push Domain → Affichage des NS
→ Utilisateur configure les NS chez le registrar
→ "Vérifier / Continuer" → DNS → Vercel → Live ✅
(~5 minutes à 24h selon propagation DNS)
```

## 🔍 Debugging

### Logs console
```bash
npm run dev

# Observer les logs :
[Cloudflare] POST /zones
[Orchestrator] Étape 1: Zone Cloudflare pour example.com
[Vercel] POST /projects/prj_xxx/domains
```

### Vérifier en DB
```sql
SELECT 
  hostname,
  domain_status,
  last_step,
  last_error
FROM domains
WHERE hostname = 'monsite.com';
```

### Erreurs fréquentes

| Erreur | Solution |
|--------|----------|
| `CLOUDFLARE_API_TOKEN non configuré` | Vérifier `.env.local` |
| `vercel_project_id manquant` | Configurer en DB |
| `Cloudflare API error: 6003` | Token invalide |
| `waiting_nameservers` bloqué | NS pas encore propagés |

## 🏗️ Architecture

```
DomainsManager (UI)
    ↓ POST /api/admin/domains/[id]/push-domain
domainOrchestrator.ts
    ↓
┌─────────────────────────────────────────┐
│ State Machine                           │
├─────────────────────────────────────────┤
│ 1. stepCloudflareZone()                │
│    → Créer/récupérer zone              │
│    → Si NS requis: waiting_nameservers  │
│                                         │
│ 2. stepConfigureDNS()                  │
│    → Créer CNAME @ et www              │
│    → dns_configured                    │
│                                         │
│ 3. stepAddToVercel()                   │
│    → Ajouter domaine au projet         │
│    → vercel_pending                    │
│                                         │
│ 4. stepCheckVercelValidation()         │
│    → Vérifier validation               │
│    → live ou rester en pending         │
└─────────────────────────────────────────┘
    ↓
cloudflare.ts + vercel.ts (providers)
    ↓
API externes
```

## 🎨 Décisions de design v1

Conformes aux instructions :

✅ **Polling uniquement** (pas de webhooks)
- Utilisateur clique sur "Vérifier / Continuer"
- Adapté pour usage interne

✅ **Pas de queue système** (pas de BullMQ/Inngest)
- L'orchestrateur s'arrête sur les étapes lentes
- Statut stocké en DB
- Reprise manuelle via l'UI

✅ **Logs simples** (console + DB)
- `console.log()` pour le dev
- Colonnes `last_step` et `last_error` en DB
- Pas de stack avancée (Sentry, etc.)

## 🚀 Prochaines étapes (hors scope v1)

- [ ] Webhooks Cloudflare/Vercel pour automatisation complète
- [ ] Queue background (BullMQ) pour polling automatique
- [ ] Champ UI pour `vercel_project_id` dans les settings du site
- [ ] Multi-organisations (tokens par site/org)
- [ ] Monitoring avancé (Sentry, Datadog)
- [ ] Support SSL custom
- [ ] Gestion DNS avancée

## 📚 Documentation complète

Voir [`docs/PUSH_DOMAIN_SETUP.md`](./PUSH_DOMAIN_SETUP.md) pour :
- Guide détaillé de configuration
- Obtention des tokens Cloudflare/Vercel
- Gestion des erreurs
- Limitations et évolutions futures

---

**Foundry Push Domain v1** - Automatisation Cloudflare + Vercel 🚀✨
