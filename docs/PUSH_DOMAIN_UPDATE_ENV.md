# 🔄 Mise à jour : VERCEL_PROJECT_ID dans .env

## Changement effectué

Le `vercel_project_id` est maintenant configuré via la variable d'environnement **`VERCEL_PROJECT_ID`** au lieu d'être stocké en base de données pour chaque domaine.

## 💡 Pourquoi ce changement ?

- **Plus simple** : Une seule configuration globale
- **Plus logique** : Si tous les sites utilisent le même projet Vercel, autant le centraliser
- **Moins de maintenance** : Pas besoin de configurer manuellement en DB pour chaque domaine
- **Cohérent** : Comme les autres configs Vercel (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`)

## ⚙️ Configuration requise

Ajoutez dans votre `.env.local` :

```env
# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxx  # ← NOUVEAU
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx    # optionnel
```

## 🔍 Trouver votre VERCEL_PROJECT_ID

### Méthode 1 : Via l'API
```bash
curl -H "Authorization: Bearer VOTRE_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects | jq '.projects[] | {name, id}'
```

### Méthode 2 : Via les settings Vercel
1. Aller sur votre projet Vercel
2. Settings → General
3. Project ID (copier)

## 🎯 Comportement

L'orchestrateur utilise maintenant cette logique :

```typescript
const vercelProjectId = domain.vercel_project_id || process.env.VERCEL_PROJECT_ID;
```

**Priorité :**
1. Si `vercel_project_id` existe en DB pour le domaine → utiliser celui-ci (override)
2. Sinon → utiliser `VERCEL_PROJECT_ID` depuis `.env` (défaut global)
3. Si aucun des deux → erreur explicite

Cela permet :
- **Comportement normal** : Tous les domaines utilisent le même projet (via `.env`)
- **Cas avancés** : Un domaine spécifique peut avoir son propre `vercel_project_id` en DB

## ✅ Vérification

Après configuration, testez :

```bash
npx ts-node scripts/test-push-config.ts
```

Doit afficher :
```
✅ Token Vercel valide
   Project ID configuré: prj_abc123xyz
   - mon-projet (prj_abc123xyz) ← CONFIGURÉ
```

## 🗑️ Colonne DB conservée

La colonne `vercel_project_id` dans la table `domains` est **conservée** mais optionnelle.

Elle peut servir pour :
- Override par domaine si besoin
- Évolutions futures (multi-projets Vercel)

## 📝 Fichiers modifiés

- ✅ `lib/env.ts` - Ajout `VERCEL_PROJECT_ID` et validation
- ✅ `.env.example` - Documentation de la nouvelle variable
- ✅ `lib/domainOrchestrator.ts` - Logique de résolution du Project ID
- ✅ `app/admin/sites/[id]/DomainsManager.tsx` - Message d'avertissement mis à jour
- ✅ `scripts/test-push-config.ts` - Affichage du Project ID configuré

## 🚀 Migration

**Aucune action nécessaire sur la DB** !

Simplement ajouter `VERCEL_PROJECT_ID` dans votre `.env.local` et c'est tout.

---

**Beaucoup plus simple** 🎉
