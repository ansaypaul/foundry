# Safe "Reset Structure" Feature

## Vue d'ensemble

Fonctionnalité ultra-sécurisée permettant de **réinitialiser complètement la structure** d'un site (catégories, auteurs, pages, types de contenu) UNIQUEMENT si le site n'a **pas de contenu publié**.

Parfait pour itérer rapidement pendant la phase de setup/développement.

## Règles de sécurité

### ✅ Reset AUTORISÉ si:
- `COUNT(*) FROM content WHERE type='post' AND status='published' = 0`
- Le site est en phase de setup
- Aucun article n'a été publié

### ❌ Reset INTERDIT si:
- Au moins 1 article publié existe
- Bouton désactivé avec message explicite
- API retourne `403 Forbidden`

## Scope du reset

Le reset supprime (pour un `site_id` donné):

### 1. **Catégories** (`terms`)
- `DELETE FROM terms WHERE site_id=? AND type='category'`
- Supprime aussi les `seo_meta` associés (`entity_type='term'`)

### 2. **Auteurs** (`authors`)
- `DELETE FROM authors WHERE site_id=?`
- Supprime aussi les `seo_meta` associés (`entity_type='author'`)

### 3. **Pages** (`content`)
- `DELETE FROM content WHERE site_id=? AND type='page'`
- Supprime aussi les `seo_meta` associés (`entity_type='content'`)

### 4. **Types de contenu** (`content_type`)
- `DELETE FROM content_type WHERE site_id=?`

### 5. **Réinitialisation du site**
- `UPDATE sites SET active_blueprint_version=NULL, setup_status='draft'`

**Note:** Les articles (drafts ou scheduled) ne sont PAS supprimés. Seuls les éléments structurels.

## Architecture

### 1. Service - `resetSiteStructure.ts`

**Fonction principale:**
```typescript
resetSiteStructure(siteId: string): Promise<ResetSiteStructureResult>
```

**Flow:**
1. Vérifie le count de contenus publiés
2. Si > 0 → Retourne `{ allowed: false, reason }`
3. Si = 0 → Supprime toutes les entités structurelles
4. Reset `active_blueprint_version` et `setup_status`
5. Retourne `{ allowed: true, deleted: { ... } }`

**Fonction de vérification:**
```typescript
canResetSiteStructure(siteId: string): Promise<{ canReset, publishedCount, reason? }>
```

### 2. API Routes

**GET `/api/admin/sites/[id]/blueprint/reset`**
- Vérifie l'éligibilité au reset
- Retourne `{ canReset, publishedCount, reason? }`

**POST `/api/admin/sites/[id]/blueprint/reset`**
- Exécute le reset
- Retourne `403` si non autorisé
- Retourne `{ success, deleted: { ... } }` si OK

### 3. UI Component - `AiBlueprintGenerator.tsx`

**Ajouts:**
- État: `canReset`, `publishedCount`, `showResetModal`, `resetting`
- `useEffect`: Vérifie l'éligibilité au chargement
- Bouton "Reset structure" (rouge)
  - Disabled si `!canReset`
  - Tooltip explicatif si disabled
- Modal de confirmation avec liste des suppressions
- Message d'info si reset impossible

**Flow UI:**
1. Chargement → Check éligibilité via GET
2. Bouton affiché selon `canReset`
3. Click → Modal de confirmation
4. Confirm → POST reset
5. Success → Alert avec détails + reload page

## Workflow complet

### Scénario 1: Site vide (autorisé)

```
1. User: Va sur /sites/[id]/setup
   ↓
2. UI: useEffect → GET /blueprint/reset
   ↓
3. API: canResetSiteStructure → { canReset: true, publishedCount: 0 }
   ↓
4. UI: Bouton "Reset structure" activé
   ↓
5. User: Click → Modal confirmation
   ↓
6. User: Confirm → POST /blueprint/reset
   ↓
7. API: resetSiteStructure → Supprime tout
   ↓
8. API: { success: true, deleted: { categories: 5, authors: 3, ... } }
   ↓
9. UI: Alert + window.location.reload()
   ↓
10. Site vierge, prêt pour nouveau blueprint
```

### Scénario 2: Site avec contenu (interdit)

```
1. User: Va sur /sites/[id]/setup
   ↓
2. UI: useEffect → GET /blueprint/reset
   ↓
3. API: canResetSiteStructure → { canReset: false, publishedCount: 12 }
   ↓
4. UI: Bouton "Reset structure" disabled
   ↓
5. UI: Message "⚠️ Reset impossible: 12 article(s) publié(s)"
   ↓
6. User: Hover → Tooltip explicatif
```

## Messages UI

### Bouton disabled (tooltip):
```
Reset impossible: X article(s) publié(s)
```

### Info box (si disabled):
```
⚠️ Reset impossible: le site contient X article(s) publié(s).
Le reset n'est autorisé que pour les sites vides.
```

### Modal de confirmation:
```
Cette action va supprimer définitivement :
• Toutes les catégories
• Tous les auteurs
• Toutes les pages (À propos, Contact, etc.)
• Tous les types de contenu
• Les métadonnées SEO associées

⚠️ Cette action est irréversible. Seuls les sites sans contenu 
publié peuvent être réinitialisés.
```

### Alert success:
```
Structure réinitialisée avec succès !

Supprimé:
- 5 catégories
- 3 auteurs
- 5 pages
- 4 types de contenu
- 13 entrées SEO
```

## Use Cases

### 1. Setup initial avec itérations
```
1. Créer site "Cuisine du Monde"
2. Générer blueprint v1
3. Appliquer
4. Voir le résultat → Pas satisfait
5. Reset structure
6. Ajuster description du site
7. Régénérer blueprint v2
8. Appliquer → Satisfait !
```

### 2. Test de différents types de sites
```
1. Créer site test
2. Générer blueprint "cuisine"
3. Appliquer → Test
4. Reset
5. Modifier site_type → "tech"
6. Générer blueprint "tech"
7. Appliquer → Compare
```

### 3. Développement/Debug
```
1. Détecter un bug dans le générateur
2. Fixer le code
3. Reset site de test
4. Régénérer pour vérifier le fix
```

## Sécurité

### Checks multiples:
1. **API GET**: Vérification avant affichage UI
2. **UI**: Bouton disabled + message
3. **API POST**: Re-vérification avant exécution
4. **Service**: Triple check du count publié

### Transactions:
Le reset n'est PAS transactionnel (Supabase limite).
Mais l'ordre de suppression minimise les risques:
1. SEO meta (dépendances)
2. Entités principales
3. Reset site state

## Limitations

### Ce qui N'EST PAS supprimé:
- Articles en draft
- Articles scheduled
- Media (images)
- Users
- Domaines
- Settings du site
- Blueprints dans `site_blueprint` (historique conservé)
- AI jobs

### Pourquoi:
- Draft/scheduled: L'utilisateur travaille peut-être dessus
- Media: Peut être réutilisé
- Historique: Utile pour comparaison

## Tests

### Test 1: Site vide → Reset OK
```
1. Créer nouveau site
2. Générer + appliquer blueprint
3. Vérifier: 0 articles publiés
4. Click reset → Modal
5. Confirm → Success
6. Vérifier: Toutes les entités supprimées
```

### Test 2: Site avec 1 article → Reset bloqué
```
1. Créer site + blueprint
2. Créer et publier 1 article
3. Aller sur setup
4. Vérifier: Bouton disabled
5. Vérifier: Message d'erreur affiché
6. Try reset via API → 403
```

### Test 3: Reset puis re-apply
```
1. Reset site
2. Générer nouveau blueprint
3. Appliquer
4. Vérifier: Pas de doublons
5. Vérifier: Structure propre
```

## Fichiers créés/modifiés

### Nouveaux fichiers:
- `lib/services/setup/resetSiteStructure.ts`
- `app/api/admin/sites/[id]/blueprint/reset/route.ts`

### Modifiés:
- `app/admin/sites/[id]/setup/AiBlueprintGenerator.tsx`
  - Ajout: Check éligibilité
  - Ajout: Bouton reset
  - Ajout: Modal confirmation
  - Ajout: Handler reset

## Acceptance

- ✅ Reset button seulement activé pour site vide
- ✅ Message clair si disabled (count articles)
- ✅ Modal de confirmation détaillée
- ✅ Après reset, applying blueprint = structure propre
- ✅ Pas de leftovers (orphelins SEO, etc.)
- ✅ API 403 si tentative sur site avec contenu
- ✅ Reload page après reset pour refresh UI

## Prochaines améliorations (optionnel)

1. **Soft delete**: Status 'archived' au lieu de hard delete
2. **Undo**: Sauvegarde temporaire pour rollback
3. **Logs**: Tracer les resets dans une table d'audit
4. **Permissions**: Limiter aux admins
