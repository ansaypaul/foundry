
# SEO Box pour les Auteurs

Ajout de la box SEO sur la page d'édition des auteurs, utilisant le système polymorphique `seo_meta`.

---

## 1. Migration DB

### Fichier: `lib/db/migration-seo-add-author-entity.sql`

Ajoute le support de `entity_type='author'` dans la table `seo_meta` :

```sql
ALTER TABLE seo_meta
  DROP CONSTRAINT IF EXISTS seo_meta_entity_type_check;

ALTER TABLE seo_meta
  ADD CONSTRAINT seo_meta_entity_type_check 
  CHECK (entity_type IN ('content', 'term', 'site', 'author'));
```

**Application:**
```bash
psql -U [user] -d [database] -f lib/db/migration-seo-add-author-entity.sql
```

---

## 2. Page d'édition d'auteur

### Fichier: `app/admin/sites/[id]/authors/[authorId]/page.tsx`

**Changements:**
- ✅ Import `getSupabaseAdmin` pour charger les SEO meta
- ✅ Chargement des `seo_meta` avec `entity_type='author'` et `entity_id=authorId`
- ✅ Merge des données SEO dans l'objet `author`
- ✅ Passage de `authorWithSeo` + `siteName` au formulaire

```typescript
// Charger les métadonnées SEO de l'auteur
const { data: seoMeta } = await supabase
  .from('seo_meta')
  .select('*')
  .eq('entity_type', 'author')
  .eq('entity_id', authorId)
  .maybeSingle();

// Merger les données SEO
const authorWithSeo = seoMeta
  ? { ...author, ...seoFields }
  : author;
```

---

## 3. Formulaire d'auteur

### Fichier: `app/admin/sites/[id]/authors/AuthorForm.tsx`

**Changements:**
- ✅ Import du composant `SeoBox`
- ✅ Ajout du prop `siteName` dans l'interface
- ✅ État `seoData` pour gérer les champs SEO
- ✅ Fonction `updateSeoData` pour mettre à jour l'état SEO
- ✅ Sync `displayName` → `seoData.name`
- ✅ Sync `bio` → `seoData.description`
- ✅ Ajout de tous les champs SEO dans le `body` du fetch
- ✅ Affichage du `<SeoBox>` avant les actions (mode edit uniquement)

**Exemple d'utilisation:**
```tsx
{mode === 'edit' && author?.id && (
  <SeoBox
    content={seoData}
    onUpdate={updateSeoData}
    siteUrl={`https://example.com`}
    siteName={siteName}
    showAnalysis={false}
    showPreview={true}
    showAdvanced={true}
  />
)}
```

---

## 4. API Update

### Fichier: `app/api/admin/sites/[id]/authors/[authorId]/route.ts`

**Changements:**
- ✅ Import `getSupabaseAdmin`
- ✅ Extraction des champs SEO du body de la requête
- ✅ Upsert dans `seo_meta` après mise à jour de l'auteur
- ✅ Utilisation de `onConflict: 'entity_type,entity_id'` pour éviter les doublons

```typescript
// Upsert dans seo_meta
await supabase
  .from('seo_meta')
  .upsert({
    entity_type: 'author',
    entity_id: authorId,
    seo_title,
    seo_description,
    // ... autres champs
  }, {
    onConflict: 'entity_type,entity_id',
  });
```

---

## 5. Champs SEO disponibles pour les auteurs

| Champ | Description |
|-------|-------------|
| `seo_title` | Titre SEO custom (fallback: display_name) |
| `seo_description` | Meta description (fallback: bio) |
| `seo_canonical` | URL canonique |
| `seo_robots_index` | Autoriser indexation (default: true) |
| `seo_robots_follow` | Autoriser suivi des liens (default: true) |
| `seo_og_title` | Titre Open Graph |
| `seo_og_description` | Description Open Graph |
| `seo_og_image` | Image Open Graph (avatar par défaut) |
| `seo_twitter_card` | Type de Twitter Card |

---

## 6. Utilisation

1. Aller sur `/admin/sites/[id]/authors/[authorId]`
2. Scroller jusqu'à la section "SEO" (après "Liens et réseaux sociaux")
3. 3 tabs disponibles:
   - **Général**: Titre, description, focus keyword
   - **Réseaux sociaux**: Open Graph, Twitter Card
   - **Avancé**: Canonical, robots directives, breadcrumb title

4. Les previews Google et Facebook s'affichent en temps réel
5. Cliquer sur "Mettre à jour" pour sauvegarder

---

## 7. Fallbacks

Le composant SeoBox utilise des fallbacks intelligents :

- **Titre SEO** → `seo_title` || `display_name`
- **Description SEO** → `seo_description` || `bio`
- **Slug** → généré depuis `display_name`

Cela signifie que même sans remplir les champs SEO custom, l'auteur aura des meta tags valides.

---

## 8. Notes importantes

- ✅ Le SeoBox n'apparaît qu'en **mode édition** (pas lors de la création)
- ✅ L'analyse SEO est désactivée (`showAnalysis={false}`) car les auteurs n'ont pas de contenu HTML à analyser
- ✅ Les previews Google/Facebook sont activées
- ✅ Les options avancées (canonical, robots) sont disponibles

---

**Status: ✅ IMPLÉMENTÉ**
**Date: 2026-02-10**
