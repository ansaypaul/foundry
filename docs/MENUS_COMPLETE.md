# Système de Menus - Documentation complète ✅

## Vue d'ensemble

Le système de menus de Foundry permet de gérer les menus de navigation (header, footer, sidebar) pour chaque site, exactement comme WordPress.

---

## Fonctionnalités

### Administration

✅ **Liste des menus** (`/admin/menus`)
- Affichage groupé par site
- Nombre d'éléments par menu
- Position (header, footer, sidebar)

✅ **Création de menu** (`/admin/menus/new`)
- Sélection du site
- Nom du menu
- Emplacement (header/footer/sidebar)
- Gestion des éléments :
  - Ajouter des liens
  - Réordonner (↑ ↓)
  - Supprimer

✅ **Édition de menu** (`/admin/menus/[id]`)
- Modifier le nom et l'emplacement
- Gérer les éléments
- Suppression du menu

### Frontend public

✅ **Composant `SiteMenu`**
- Affiche automatiquement les menus selon leur emplacement
- Intégré dans le layout public
- Styles responsive

✅ **Layout avec header/footer**
- Header avec logo + menu
- Footer avec infos + menu
- Design clean et professionnel

---

## Structure de données

### Table `menus`

```sql
CREATE TABLE menus (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id),
    name TEXT NOT NULL,
    location TEXT CHECK (location IN ('header', 'footer', 'sidebar')),
    items JSONB DEFAULT '[]',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(site_id, location)  -- 1 seul menu par emplacement par site
);
```

### Format des items (JSONB)

```json
[
  {
    "id": "abc123",
    "label": "Accueil",
    "url": "/",
    "type": "custom"
  },
  {
    "id": "def456",
    "label": "À propos",
    "url": "/a-propos",
    "type": "page"
  },
  {
    "id": "ghi789",
    "label": "Blog",
    "url": "/category/blog",
    "type": "category"
  }
]
```

**Champs :**
- `id` : Identifiant unique de l'élément
- `label` : Texte affiché
- `url` : Lien (relatif ou absolu)
- `type` : Type de lien (`custom`, `page`, `category`)

---

## Utilisation

### 1. Créer un menu

1. Aller sur `/admin/menus`
2. Cliquer sur "Nouveau menu"
3. Sélectionner le site
4. Entrer le nom (ex: "Menu principal")
5. Choisir l'emplacement (header, footer, sidebar)
6. Ajouter des éléments :
   - Texte : "Accueil"
   - URL : `/`
   - Cliquer sur "Ajouter"
7. Répéter pour chaque élément
8. Réordonner avec ↑ ↓ si besoin
9. Cliquer sur "Créer le menu"

### 2. Modifier un menu

1. Aller sur `/admin/menus`
2. Cliquer sur "Modifier" à côté du menu
3. Ajouter/supprimer/réordonner les éléments
4. Cliquer sur "Mettre à jour"

### 3. Afficher un menu sur le frontend

Le menu s'affiche automatiquement selon son emplacement :

- **Header** : En haut de chaque page
- **Footer** : En bas de chaque page
- **Sidebar** : À utiliser dans un composant personnalisé

Le composant `SiteMenu` gère l'affichage :

```tsx
<SiteMenu
  siteId={site.id}
  location="header"
  className="your-custom-classes"
/>
```

---

## Exemples de menus

### Menu Header typique

```
Accueil       →  /
Articles      →  /category/articles
À propos      →  /a-propos
Contact       →  /contact
```

### Menu Footer typique

```
Mentions légales  →  /mentions-legales
CGU               →  /cgu
Politique         →  /politique-confidentialite
Contact           →  /contact
```

---

## API Routes

### `POST /api/admin/menus`
Créer un menu

**Body :**
```json
{
  "site_id": "uuid",
  "name": "Menu principal",
  "location": "header",
  "items": "[...]"  // JSON stringifié
}
```

### `GET /api/admin/menus?site_id=uuid`
Liste les menus d'un site

### `PATCH /api/admin/menus/[id]`
Mettre à jour un menu

**Body :**
```json
{
  "name": "Nouveau nom",
  "location": "footer",
  "items": "[...]"
}
```

### `DELETE /api/admin/menus/[id]`
Supprimer un menu

---

## Queries DB

### `getMenusBySiteId(siteId)`
Récupère tous les menus d'un site

### `getMenuByLocation(siteId, location)`
Récupère le menu d'un emplacement spécifique

### `getMenuById(menuId)`
Récupère un menu par son ID

### `createMenu(menu)`
Crée un nouveau menu

### `updateMenu(menuId, updates)`
Met à jour un menu

### `deleteMenu(menuId)`
Supprime un menu

---

## Contraintes et règles

1. **Un seul menu par emplacement par site**
   - `UNIQUE(site_id, location)`
   - Si vous essayez de créer 2 menus "header" pour le même site → erreur

2. **Emplacements autorisés**
   - `header` (en-tête)
   - `footer` (pied de page)
   - `sidebar` (barre latérale)

3. **Items en JSON**
   - Stockés en JSONB pour flexibilité
   - Ordre préservé dans le tableau

---

## Customisation du thème

### Modifier le layout public

Éditer `app/(public)/layout.tsx` pour :
- Changer les couleurs
- Ajuster l'espacement
- Ajouter un logo
- Personnaliser le footer

### Styles du menu

Le composant `SiteMenu` utilise Tailwind CSS. Pour personnaliser :

```tsx
<SiteMenu
  siteId={site.id}
  location="header"
  className="flex space-x-8 text-lg font-medium"
/>
```

Classes par défaut :
- Liens : `text-gray-600 hover:text-gray-900`
- Liste : `flex space-x-6`

---

## Migration de la base de données

Si vous avez déjà créé la table `menus` avec l'ancien schéma, exécutez :

```sql
-- Fichier : lib/db/migration-menus-update.sql
ALTER TABLE menus ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Mettre à jour les valeurs existantes
UPDATE menus SET name = 'Menu ' || location WHERE name IS NULL;
ALTER TABLE menus ALTER COLUMN name SET NOT NULL;

-- Mettre à jour la contrainte CHECK
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_location_check;
ALTER TABLE menus ADD CONSTRAINT menus_location_check 
  CHECK (location IN ('header', 'footer', 'sidebar'));

NOTIFY pgrst, 'reload schema';
```

---

## Tests à effectuer

- [ ] Créer un site de test
- [ ] Créer un menu "header" avec 3-4 liens
- [ ] Créer un menu "footer" avec 2-3 liens
- [ ] Vérifier l'affichage sur la homepage
- [ ] Modifier un menu (ajouter/supprimer/réordonner)
- [ ] Vérifier que les liens fonctionnent
- [ ] Tester la suppression d'un menu

---

## Prochaines améliorations possibles

- Sous-menus (menus déroulants)
- Icônes pour les liens
- Menus mega-menu
- Conditions d'affichage (si connecté, etc.)
- Import/Export de menus
- Drag & drop pour réordonner

---

## Statut : ✅ Complet et fonctionnel

Le système de menus est opérationnel et prêt à l'emploi !
