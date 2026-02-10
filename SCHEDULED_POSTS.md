# 📅 Publications Programmées (Scheduled Posts)

## Comment ça marche ?

Les articles avec le statut **"scheduled"** (programmé) sont automatiquement publiés quand leur date de publication arrive, grâce à un **Cron Job Vercel**.

### Workflow :

```
1. Créer un article
2. Statut = "Publié" + Date future
   → Statut automatiquement changé en "scheduled"
3. Vercel Cron s'exécute toutes les minutes
4. Si published_at <= maintenant
   → Statut changé en "published"
5. L'article est visible sur le site ! ✅
```

## 🔧 Configuration

### 1. Ajouter la variable d'environnement

Dans tes **settings Vercel**, ajoute :

```
CRON_SECRET=votre_token_secret_aleatoire
```

**Générer un token aléatoire :**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Ou utiliser un générateur en ligne
https://generate-secret.vercel.app/32
```

### 2. Le fichier `vercel.json` (déjà créé)

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule expliqué** :
- `* * * * *` = **Toutes les minutes**
- `*/5 * * * *` = Toutes les 5 minutes
- `0 * * * *` = Toutes les heures
- `0 9 * * *` = Tous les jours à 9h00

### 3. Deploy sur Vercel

```bash
# Commit et push
git add .
git commit -m "Add scheduled posts cron job"
git push

# Sur Vercel, le cron sera automatiquement activé
```

## 🧪 Tester manuellement

Tu peux tester la route localement ou en production :

```bash
# Local (dev)
curl -H "Authorization: Bearer votre_token" http://localhost:3000/api/cron/publish-scheduled

# Production
curl -H "Authorization: Bearer votre_token" https://votre-domaine.com/api/cron/publish-scheduled
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Published 2 article(s)",
  "published": 2,
  "articles": [
    { "id": "xxx", "title": "Mon article", "slug": "mon-article" }
  ]
}
```

## 📊 Monitoring

### Logs Vercel

1. Va sur **Vercel Dashboard**
2. Onglet **"Deployments"**
3. Clique sur **"Functions"**
4. Cherche `/api/cron/publish-scheduled`
5. Tu verras les logs d'exécution

### Vérifier les articles programmés

```sql
-- Articles en attente de publication
SELECT id, title, slug, published_at, status
FROM content
WHERE status = 'scheduled'
ORDER BY published_at ASC;

-- Articles publiés récemment par le cron
SELECT id, title, slug, published_at, updated_at
FROM content
WHERE status = 'published'
  AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

## ⚠️ Important

### Limites Vercel

- **Plan Hobby** : 1 cron job, exécutions limitées
- **Plan Pro** : Multiples crons, plus d'exécutions
- Le cron peut avoir un délai de **1 minute max**

### Alternative : Supabase Edge Function

Si tu veux plus de contrôle, tu peux utiliser une Edge Function Supabase avec pg_cron :

```sql
-- Installer l'extension (Plan Pro uniquement)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer un job qui s'exécute toutes les minutes
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
    UPDATE content
    SET status = 'published'
    WHERE status = 'scheduled'
      AND published_at <= NOW();
  $$
);
```

## 🎯 Bonnes pratiques

1. **Toujours tester en local** avant de deploy
2. **Mettre un token fort** dans CRON_SECRET
3. **Monitorer les logs** régulièrement
4. **Prévoir une marge** : programme 2-3 minutes avant l'heure souhaitée

## 🐛 Debugging

### L'article ne se publie pas automatiquement

1. Vérifier que `vercel.json` est bien commité
2. Vérifier que `CRON_SECRET` est configuré sur Vercel
3. Vérifier les logs Vercel pour voir les erreurs
4. Vérifier que `published_at` est bien dans le passé
5. Appeler manuellement l'API pour tester

### Erreur 401 Unauthorized

→ Le `CRON_SECRET` n'est pas configuré ou incorrect

### Erreur 500

→ Problème de connexion Supabase ou erreur SQL
→ Vérifier les logs pour plus de détails
