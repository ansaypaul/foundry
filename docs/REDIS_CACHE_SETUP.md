# Redis Cache + ISR Setup

## 🎯 Objectif

Optimiser les performances en cachant la résolution hostname → siteId dans Redis, permettant à ISR de fonctionner correctement.

**Résultat attendu :**
- Middleware : ~10-20ms (au lieu de 100ms)
- Pages : 200-300ms première visite, puis < 100ms avec ISR
- `x-vercel-cache: HIT` ✅

---

## 📋 Setup complet

### 1. Variables d'environnement

Ajoute dans ton `.env.local` (et Vercel) :

```bash
UPSTASH_REDIS_REST_URL="https://enabling-chow-52237.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AcwNAAIncDIwNjQ2YzE3NzZhYmM0OWM1YjY3Mzc5YzJjOGFmOTY3MnAyNTIyMzc"
REVALIDATE_SECRET="ton_secret_aleatoire_ici"
```

**Générer le REVALIDATE_SECRET :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Migration initiale de Redis

Peupler Redis avec tous les domaines existants :

```bash
npx tsx scripts/populate-redis.ts
```

Cela va cacher tous les domaines actifs dans Redis.

### 3. Configurer le webhook Supabase

**A. Exécuter le SQL dans Supabase :**

1. Va dans Supabase → SQL Editor
2. Ouvre `lib/db/migration-redis-sync-trigger.sql`
3. **IMPORTANT :** Remplace `https://your-app.vercel.app` par ton URL de production
4. Exécute le SQL

**B. Vérifier que ça marche :**

```sql
-- Test du trigger
UPDATE domains SET hostname = hostname WHERE id = (SELECT id FROM domains LIMIT 1);
```

Vérifie les logs de ton API `/api/sync-redis` dans Vercel.

### 4. Déployer sur Vercel

```bash
git add .
git commit -m "feat: Redis cache + ISR optimization"
git push
```

**Dans Vercel :**
1. Settings → Environment Variables
2. Ajoute les 3 variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, REVALIDATE_SECRET)
3. Redéploie

### 5. Vérifier le fonctionnement

**Test du cache Redis :**
1. Visite une page : `https://ton-site.com/article`
2. Vérifie les logs Vercel : tu devrais voir `[Redis] Cache HIT` ou `[Redis] Cache MISS → fetched from DB`
3. Visite à nouveau : tu devrais voir `[Redis] Cache HIT`

**Test de l'ISR :**
1. Première visite : headers doivent montrer `x-vercel-cache: MISS`
2. Deuxième visite (dans les 5 min) : headers doivent montrer `x-vercel-cache: HIT`
3. Timing : < 100ms au lieu de 1.5s

---

## 🔧 Usage

### Invalider le cache d'une page après publication

Dans ton formulaire d'édition de contenu, après avoir sauvé :

```typescript
// app/admin/sites/[id]/content/[contentId]/page.tsx
async function handleSave() {
  // ... sauvegarder le contenu ...
  
  // Invalider le cache ISR de cette page
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: `/${content.slug}`,
      siteId: siteId,
      secret: process.env.REVALIDATE_SECRET
    })
  });
}
```

### Invalider le cache Redis d'un domaine

Si tu changes un hostname dans l'admin, le trigger SQL s'en occupe automatiquement !

Mais si tu veux le faire manuellement :

```typescript
import { invalidateSiteIdCache } from '@/lib/redis/client';

await invalidateSiteIdCache('old-domain.com');
```

---

## 📊 Monitoring

### Vérifier l'utilisation Redis

Dashboard Upstash : https://console.upstash.com

**Commandes Redis pour debug :**

```bash
# Voir toutes les clés
redis-cli --tls -u redis://default:YOUR_TOKEN@enabling-chow-52237.upstash.io:6379 KEYS "hostname:*"

# Voir une clé spécifique
redis-cli --tls -u redis://default:YOUR_TOKEN@enabling-chow-52237.upstash.io:6379 GET "hostname:boulette.localhost"

# Supprimer toutes les clés (ATTENTION !)
redis-cli --tls -u redis://default:YOUR_TOKEN@enabling-chow-52237.upstash.io:6379 FLUSHALL
```

### Logs Vercel

Cherche dans les logs :
- `[Redis]` pour les opérations de cache
- `[Redis Sync]` pour les webhooks
- `[Revalidation]` pour les invalidations ISR

---

## 🚀 Optimisations futures

1. **Augmenter le TTL du cache** si les domaines changent rarement :
   - Dans `lib/redis/client.ts` : `HOSTNAME_CACHE_TTL = 60 * 60 * 24 * 7` (7 jours)

2. **Pré-warming du cache** :
   - Exécuter `scripts/populate-redis.ts` régulièrement (cron daily)

3. **Cacher d'autres données** :
   - Sitemaps générés
   - Menus
   - Settings SEO

---

## ❓ Troubleshooting

**Le cache ne fonctionne pas :**
- Vérifie que les variables d'env sont bien dans Vercel
- Vérifie que tu as exécuté `populate-redis.ts`
- Check les logs Vercel pour voir les erreurs

**ISR toujours MISS :**
- Attends 2-3 minutes après le premier déploiement
- Vérifie qu'il n'y a pas de `searchParams` ou `cookies()` dans les pages
- Regarde les headers : `cache-control` doit avoir `s-maxage=300`

**Webhook Supabase ne marche pas :**
- Vérifie que l'URL dans le trigger SQL est correcte (pas localhost !)
- Check que `pg_net` extension est activée
- Regarde les logs Supabase : Functions → Edge Functions logs

---

## 🎉 Résultat

Avec ce setup, ton site devrait être **ultra rapide** :
- ✅ Middleware : 10-20ms (au lieu de 100ms)
- ✅ Pages : < 500ms (au lieu de 1.5s)
- ✅ Cache ISR qui fonctionne
- ✅ Sync auto Redis via webhook
- ✅ Invalidation on-demand

**Ton site est maintenant plus rapide que WordPress ! 🚀**
