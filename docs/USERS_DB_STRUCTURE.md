# ✅ Structure DB des utilisateurs

## Tables existantes

### **1. Table `users`**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Table `memberships`**
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'author')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);
```

### **3. Colonne `author_id` dans `content`**
```sql
author_id UUID REFERENCES users(id) ON DELETE SET NULL
```

---

## ✅ Tout est en place !

### **Structure DB** :
- ✅ Table `users`
- ✅ Table `memberships` (relation many-to-many users ↔ sites)
- ✅ Colonne `author_id` dans `content`
- ✅ 3 rôles : `admin`, `editor`, `author`

### **Interface admin** :
- ✅ `/admin/users` - Gestion globale
- ✅ `/admin/sites/[id]/users` - **Utilisateurs du site** (dans la sidebar !)
- ✅ Sélecteur d'auteur dans les formulaires

### **Seed data** :
- ✅ Utilisateur admin par défaut : `admin@foundry.local` / `admin123`

---

## 🚀 Utilisation

1. Va sur `/admin/sites/[ton-site-id]/users` (dans la sidebar "👥 Utilisateurs")
2. Tu verras les utilisateurs ayant accès à ce site
3. Clique sur "Gérer" pour modifier leurs accès
4. Ou ajoute un utilisateur existant depuis la liste

Tout fonctionne maintenant ! 🎉
