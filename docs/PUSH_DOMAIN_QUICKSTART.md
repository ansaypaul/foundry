# 🚀 Quick Start - Push Domain en 5 minutes

## 1️⃣ Migration SQL (30 secondes)

Dans Supabase SQL Editor :

```sql
-- Copier-coller le contenu de: lib/db/migration-domain-push.sql
-- Puis exécuter
```

## 2️⃣ Configurer .env.local (2 minutes)

Créer/éditer `.env.local` à la racine :

```env
# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel  
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx  # optionnel
```

### Où trouver ces valeurs ?

**CLOUDFLARE_API_TOKEN** :
- https://dash.cloudflare.com/profile/api-tokens
- Create Token → Custom → Permissions: Zone:Read + DNS:Edit

**CLOUDFLARE_ACCOUNT_ID** :
- Visible dans le dashboard Cloudflare (sidebar droite)

**VERCEL_TOKEN** :
- https://vercel.com/account/tokens
- Create → Full Account

**VERCEL_PROJECT_ID** :
```bash
curl -H "Authorization: Bearer VOTRE_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects | jq '.projects[0].id'
```

**VERCEL_TEAM_ID** (optionnel) :
- Si vos projets sont dans une team
- URL : `vercel.com/teams/{TEAM_ID}`

## 3️⃣ Tester (30 secondes)

```bash
npx ts-node scripts/test-push-config.ts
```

✅ Attendu :
```
✅ Toutes les variables requises sont présentes
✅ Token Cloudflare valide
✅ Token Vercel valide
   Project ID configuré: prj_abc123xyz
✨ Configuration complète et fonctionnelle !
```

## 4️⃣ Utiliser (1 minute)

1. Dans l'admin Foundry : Sites → [Votre site]
2. Section "Domaines"
3. Ajouter un domaine (ex: `monsite.com`)
4. Cliquer sur **"Push Domain"** ✨

## 🎯 États du workflow

```
Push Domain
    ↓
waiting_nameservers (si nouveau domaine)
    → Configurer les NS chez le registrar
    → Cliquer "Vérifier / Continuer"
    ↓
dns_configured
    ↓
vercel_pending (attendre propagation DNS)
    → Cliquer "Vérifier / Continuer"
    ↓
live ✅
```

## ⚡ Cas d'usage typiques

### Domaine déjà sur Cloudflare
```
Push Domain → dns_configured → vercel_pending → live
(~30 secondes à 2 minutes)
```

### Nouveau domaine
```
Push Domain → waiting_nameservers
→ [Configurer NS manuellement]
→ Vérifier → dns_configured → vercel_pending → live
(~5 minutes à 24h selon propagation)
```

## 🔍 Debug rapide

### Voir les logs
```bash
npm run dev
# Observer la console
```

### Vérifier en DB
```sql
SELECT hostname, domain_status, last_error
FROM domains
WHERE hostname = 'monsite.com';
```

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| `CLOUDFLARE_API_TOKEN non configuré` | Vérifier `.env.local` |
| `VERCEL_PROJECT_ID manquant` | Ajouter dans `.env.local` |
| `Cloudflare API error: 6003` | Token Cloudflare invalide |
| `waiting_nameservers` bloqué | NS pas propagés, attendre |

## 📚 Documentation complète

- **Setup complet** : `docs/PUSH_DOMAIN_SETUP.md`
- **Checklist déploiement** : `docs/PUSH_DOMAIN_CHECKLIST.md`
- **Liste des fichiers** : `docs/PUSH_DOMAIN_FILES.md`
- **Changement .env** : `docs/PUSH_DOMAIN_UPDATE_ENV.md`

---

**C'est prêt !** 🎉

Le Push Domain est maintenant opérationnel. Ajoutez vos domaines et laissez la magie opérer.
