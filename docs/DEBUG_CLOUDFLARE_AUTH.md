# 🔍 Debug Cloudflare Authentication Error

## ⚠️ Problème détecté

Erreur d'authentification Cloudflare (code 10000) lors de l'accès aux DNS records.

## 🛠️ Outils de debug installés

### 1. Endpoint de vérification du token

**URL:** `http://localhost:3000/api/admin/cloudflare/verify`

**Usage:**
```bash
# Dans votre navigateur ou via curl
curl http://localhost:3000/api/admin/cloudflare/verify
```

**Réponse attendue si OK:**
```json
{
  "success": true,
  "cloudflareResponse": {
    "success": true,
    "result": {
      "id": "...",
      "status": "active"
    }
  },
  "debug": {
    "tokenPresent": true,
    "tokenLength": 40,
    "tokenPreview": "5wY8EWOquz...C7Jo"
  }
}
```

**Réponse si token invalide:**
```json
{
  "success": false,
  "cloudflareResponse": {
    "success": false,
    "errors": [
      {
        "code": 10000,
        "message": "Authentication error"
      }
    ]
  }
}
```

### 2. Logs de debug améliorés

Le fichier `lib/providers/cloudflare.ts` affiche maintenant :
- ✅ Présence du token
- ✅ Longueur du token
- ✅ Début du token (10 premiers caractères)
- ✅ Headers utilisés
- ✅ Status HTTP de la réponse
- ✅ Détails complets des erreurs

### 3. Runtime Node.js forcé

Les routes API utilisent maintenant `export const runtime = 'nodejs'` pour garantir l'accès complet aux variables d'environnement.

## 📋 Procédure de debug

### Étape 1 : Vérifier le token isolément

```bash
# Ouvrir dans le navigateur
http://localhost:3000/api/admin/cloudflare/verify
```

**Résultats possibles :**

| Résultat | Signification | Action |
|----------|---------------|--------|
| `success: true` | Token valide ✅ | Le problème est ailleurs (permissions, scope) |
| `success: false, code: 10000` | Token invalide ❌ | Créer un nouveau token Cloudflare |
| `success: false, "missing"` | Token absent ❌ | Vérifier `.env` et redémarrer le serveur |

### Étape 2 : Analyser les logs

Dans le terminal Next.js, chercher :

```
[CF Verify] Token present: true/false
[CF Verify] Token length: XX
[CF Verify] Token preview: ...
[CF Verify] Response status: XXX
```

### Étape 3 : Vérifier les permissions du token

Si le token est **valide** mais que l'erreur persiste, vérifier les permissions sur Cloudflare :

1. Aller sur https://dash.cloudflare.com/profile/api-tokens
2. Trouver votre token (cliquer sur "View")
3. Vérifier que les permissions incluent :
   - ✅ **Zone** → **Zone** → **Read**
   - ✅ **Zone** → **DNS** → **Edit**
4. Vérifier que le scope inclut `camera-surveillance.fr` ou "All zones"

## 🔧 Corrections possibles

### Cas 1 : Token invalide

**Symptôme :** `/api/admin/cloudflare/verify` retourne `success: false`

**Solution :**
1. Créer un nouveau token sur Cloudflare
2. Remplacer dans `.env` :
   ```env
   CLOUDFLARE_API_TOKEN=nouveau_token_ici
   ```
3. Redémarrer : `Ctrl+C` puis `npm run dev`
4. Re-tester : `http://localhost:3000/api/admin/cloudflare/verify`

### Cas 2 : Token valide mais permissions insuffisantes

**Symptôme :** 
- `/api/admin/cloudflare/verify` → `success: true`
- Mais Push Domain → erreur 10000 sur DNS

**Solution :**
1. Éditer le token sur Cloudflare
2. Ajouter les permissions DNS:Edit
3. Sauvegarder
4. Re-tester

### Cas 3 : Token absent

**Symptôme :** 
```json
{
  "success": false,
  "error": "CLOUDFLARE_API_TOKEN is missing or empty"
}
```

**Solution :**
1. Vérifier que `.env` contient bien `CLOUDFLARE_API_TOKEN=...`
2. Vérifier qu'il n'y a pas d'espaces avant/après le `=`
3. Redémarrer le serveur

## 📊 Checklist de debug

- [ ] Tester `http://localhost:3000/api/admin/cloudflare/verify`
- [ ] Vérifier les logs dans le terminal Next.js
- [ ] Confirmer que le token a 40+ caractères
- [ ] Vérifier les permissions du token sur Cloudflare
- [ ] Vérifier le scope du token (zones autorisées)
- [ ] Redémarrer le serveur après modification `.env`

## 🎯 Diagnostic rapide

```bash
# Test rapide du token
curl -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

Réponse attendue :
```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

## 📝 Format du token Cloudflare

Un token API Cloudflare valide :
- Longueur : généralement 40+ caractères
- Format : alphanumériques + tirets + underscores
- Exemple : `5wY8EWOquzQUuo56YTKbcRLwVXwzqG9IK-mBC7Jo`

**Note :** Votre token actuel (`5wY8EWOquzQUuo56YTKbcRLwVXwzqG9IK-mBC7Jo`) semble court. Les tokens récents peuvent être plus longs.

## 🚀 Prochaines étapes

1. **Tester immédiatement :** Ouvrir `http://localhost:3000/api/admin/cloudflare/verify`
2. **Analyser le résultat**
3. **Appliquer la correction appropriée**
4. **Re-tester le Push Domain**

---

**Debug tools ready** 🔍
