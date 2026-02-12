# FOUNDRY – SEO Bootstrap v1

Système de génération automatique de métadonnées SEO minimales pour les sites, pages et catégories lors du setup.

---

## Objectif

Lors du bootstrap d'un site (création de catégories, pages, etc.), le système doit créer automatiquement des enregistrements `seo_meta` avec des valeurs par défaut intelligentes pour éviter un site incomplet.

**Principe:** Déterministe, aucune IA. Templates et règles simples.

---

## 1. Architecture

### Services (`lib/services/setup/seoBootstrap.ts`)

#### `buildSeoBootstrapPlan(siteId)`
Analyse l'état actuel et retourne un plan de ce qui doit être créé :
- `siteSeo`: Defaults SEO pour le site (templates, stratégie)
- `contentSeo[]`: Liste des pages sans SEO
- `termSeo[]`: Liste des catégories sans SEO

#### `applySeoBootstrapPlan(siteId, plan)`
Applique le plan en créant les enregistrements `seo_meta` manquants.
**Idempotent**: Ne modifie jamais les SEO existants.

#### `getSeoBootstrapStats(siteId)`
Retourne les statistiques actuelles :
- `siteSeoExists`: boolean
- `contentSeoCount`: nombre de pages avec SEO
- `termSeoCount`: nombre de catégories avec SEO
- `contentMissingCount`: nombre de pages sans SEO
- `termMissingCount`: nombre de catégories sans SEO

---

## 2. Règles de génération

### Site defaults (`entity_type='site'`)

Créé une seule fois si manquant :

```javascript
{
  seo_title: '{{title}} | {{siteName}}',  // Template
  seo_description: 'excerpt_or_first_paragraph_155',  // Stratégie
  seo_og_image: null,
  seo_og_type: 'article',
  seo_robots_index: true,
  seo_robots_follow: true
}
```

### Pages (`entity_type='content'`)

Pour chaque page sans SEO existant :

```javascript
{
  seo_title: `${page.title} | ${site.name}`,
  seo_description: buildPageDescription(page.title, site.name, page.page_type),
  seo_og_title: `${page.title} | ${site.name}`,
  seo_og_description: buildPageDescription(...),
  seo_og_image: null,
  seo_og_type: 'website',
  seo_robots_index: true,
  seo_robots_follow: true
}
```

**Descriptions par type de page:**
- `about`: "Découvrez qui nous sommes et notre mission sur {siteName}."
- `contact`: "Contactez l'équipe de {siteName} pour toute question ou demande."
- `legal`: "Mentions légales et informations juridiques de {siteName}."
- `privacy`: "Politique de confidentialité et protection des données sur {siteName}."
- `terms`: "Conditions générales d'utilisation de {siteName}."
- Générique: "{pageTitle} - Toutes les informations sur {siteName}."

### Catégories (`entity_type='term'`)

Pour chaque catégorie sans SEO existant :

```javascript
{
  seo_title: `${category.name} | ${site.name}`,
  seo_description: `Tous nos articles sur ${category.name} : actualités, analyses, dossiers et sélections par la rédaction de ${site.name}.`,
  seo_og_title: `${category.name} | ${site.name}`,
  seo_og_description: ...,
  seo_og_image: null,
  seo_og_type: 'website',
  seo_robots_index: true,
  seo_robots_follow: true
}
```

---

## 3. API

### GET `/api/admin/sites/[id]/setup/seo-bootstrap`

Retourne les stats et un aperçu du plan :

```json
{
  "stats": {
    "siteSeoExists": false,
    "contentSeoCount": 0,
    "termSeoCount": 2,
    "contentMissingCount": 5,
    "termMissingCount": 3
  },
  "plan": {
    "siteSeoWillBeCreated": true,
    "contentSeoToCreate": 5,
    "termSeoToCreate": 3
  }
}
```

### POST `/api/admin/sites/[id]/setup/seo-bootstrap`

Applique le SEO bootstrap et retourne les stats mises à jour :

```json
{
  "success": true,
  "stats": { ... },
  "created": {
    "siteSeo": true,
    "contentSeo": 5,
    "termSeo": 3
  }
}
```

---

## 4. UI

### Composant `SeoBootstrapSetup.tsx`

Carte dans la page de setup (`/admin/sites/[id]/setup`) :

**Affichage:**
- 3 cartes de stats (Site defaults, Pages, Catégories)
- Badge visuel du statut (Configuré / Manquant)
- Preview de ce qui sera créé
- Bouton "Générer le SEO minimal"
- Actualisation automatique après application

**États:**
- Loading
- Ready (needsBootstrap)
- Applied (tout est configuré)
- Error

**Idempotence visible:**
Note affichée : "Cette opération est idempotente. Elle ne modifie pas les métadonnées SEO existantes."

---

## 5. Blueprint v1 - SEO Integration

Le blueprint stocke maintenant :

### `seoDefaults`

```typescript
{
  contentTitleTemplate: string,      // '{{title}} | {{siteName}}'
  termTitleTemplate: string,         // '{{name}} | {{siteName}}'
  descriptionStrategy: string,       // 'excerpt_or_first_paragraph_155'
  defaultOgImage: string | null,
  defaultOgType: string,              // 'article'
  robotsDefault: {
    index: boolean,
    follow: boolean
  }
}
```

Chargé depuis la ligne `seo_meta` du site (`entity_type='site'`).

### `seoBootstrap`

```typescript
{
  applied: boolean,                   // siteSeoExists
  stats: {
    contentSeoCount: number,
    termSeoCount: number,
    siteSeoExists: boolean
  }
}
```

Permet de voir dans un blueprint snapshot si le SEO a été appliqué et combien d'entités ont des métadonnées.

**Note:** On ne stocke PAS les `seo_meta` individuels dans le blueprint (trop volumineux). Seulement les defaults et les stats.

---

## 6. Tests

### `seoBootstrap.test.ts`

**Scénarios testés:**
1. ✅ Créé site SEO defaults si manquant
2. ✅ Créé SEO pour pages sans SEO existant
3. ✅ Créé SEO pour catégories sans SEO existant
4. ✅ Insère site SEO via applySeoBootstrapPlan
5. ✅ Idempotent - ne fait rien si SEO déjà présent

---

## 7. Utilisation

### Workflow

1. **Créer un site** → `/admin/sites/new`
2. **Aller au setup** → `/admin/sites/[id]/setup`
3. **Générer authors, categories, pages** (via les generators v1)
4. **Scroller jusqu'à "SEO minimal"**
5. **Cliquer "Générer le SEO minimal"**
6. ✅ Toutes les pages et catégories ont maintenant des meta tags

### Ou via API directe

```bash
POST /api/admin/sites/[siteId]/setup/seo-bootstrap
```

---

## 8. Avantages

✅ **Zero config needed:** Les valeurs par défaut sont intelligentes  
✅ **Idempotent:** Peut être relancé sans risque  
✅ **Pas d'overwrite:** Les SEO custom ne sont jamais écrasés  
✅ **Déterministe:** Toujours les mêmes résultats pour les mêmes inputs  
✅ **Lightweight:** Pas de données volumineuses dans le blueprint  
✅ **Visible:** Stats claires dans le setup et le blueprint  

---

## 9. Prochaines étapes (v2)

- [ ] Templates dynamiques basés sur `site_type`
- [ ] Génération d'images OG par défaut (logo/placeholder)
- [ ] Analyse de densité de mots-clés pour catégories
- [ ] Auto-run après generators (option)
- [ ] Bulk update de SEO existants (opt-in)

---

**Status: ✅ IMPLÉMENTÉ**  
**Version: 1.0**  
**Date: 2026-02-10**
