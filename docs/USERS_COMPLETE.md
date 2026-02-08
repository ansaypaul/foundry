# 👥 Système de gestion des utilisateurs

## ✅ Fonctionnalités complètes (comme WordPress)

### **1. Gestion globale des utilisateurs** `/admin/users`
- ✅ Liste de tous les utilisateurs
- ✅ Créer un nouvel utilisateur
- ✅ Voir les sites auxquels chaque utilisateur a accès
- ✅ Affichage : nom, email, nombre de sites, date de création

### **2. Édition d'utilisateur** `/admin/users/[id]`
- ✅ Modifier nom, email
- ✅ Changer le mot de passe
- ✅ Gérer les accès aux sites (memberships)
- ✅ Ajouter/retirer l'accès à un site
- ✅ Définir le rôle par site : **Admin**, **Éditeur**, **Auteur**
- ✅ Supprimer l'utilisateur

### **3. Sélection d'auteur dans les contenus**
- ✅ Champ "Auteur" dans le formulaire de création d'article/page
- ✅ Liste déroulante avec tous les utilisateurs ayant accès au site
- ✅ Stockage de `author_id` dans la table `content`

### **4. Sécurité des mots de passe**
- ✅ Hash avec `bcryptjs` (10 rounds)
- ✅ Changement de mot de passe optionnel (laisser vide = pas de changement)
- ✅ Validation minimale : 8 caractères

## 📁 Nouveaux fichiers créés

### **Pages admin** :
- `app/admin/users/page.tsx` - Liste des utilisateurs
- `app/admin/users/new/page.tsx` - Créer un utilisateur
- `app/admin/users/[id]/page.tsx` - Modifier un utilisateur
- `app/admin/users/[id]/UserEditForm.tsx` - Formulaire d'édition

### **API** :
- `app/api/admin/users/route.ts` - POST pour créer
- `app/api/admin/users/[id]/route.ts` - PATCH/DELETE pour modifier/supprimer
- `app/api/admin/memberships/route.ts` - POST pour ajouter un accès
- `app/api/admin/memberships/[id]/route.ts` - DELETE pour retirer un accès
- `app/api/admin/sites/[id]/authors/route.ts` - GET les auteurs d'un site

### **Modifications** :
- `app/admin/AdminLayoutClient.tsx` - Ajout du lien "Utilisateurs" dans le menu
- `app/admin/sites/[id]/content/new/ContentForm.tsx` - Ajout du sélecteur d'auteur
- `app/api/admin/content/route.ts` - Accepte `author_id`

## 🔑 Rôles disponibles

### **Admin** (rôle `admin`)
- Accès complet au site
- Peut gérer les paramètres, thèmes, menus
- Peut gérer tous les contenus

### **Éditeur** (rôle `editor`)
- Peut créer/modifier/supprimer tous les contenus
- Peut gérer les médias, catégories, tags
- Ne peut pas modifier les paramètres du site

### **Auteur** (rôle `author`)
- Peut créer/modifier ses propres contenus
- Peut uploader des médias
- Ne peut pas supprimer ou modifier les contenus des autres

> **Note** : Les permissions par rôle ne sont pas encore implémentées dans le code, c'est la structure pour plus tard. Pour l'instant, tous les utilisateurs avec un membership ont accès complet.

## 🚀 Utilisation

### **1. Créer un utilisateur**
```
Admin > Utilisateurs > + Nouvel utilisateur
→ Remplir nom, email, mot de passe
→ Utilisateur créé mais sans accès à aucun site
```

### **2. Donner accès à un site**
```
Admin > Utilisateurs > [Cliquer sur un utilisateur]
→ Section "Accès aux sites"
→ Sélectionner un site + rôle
→ Cliquer "Ajouter l'accès"
```

### **3. Attribuer un auteur à un article**
```
Site Admin > Articles > Nouvel article
→ Dans le bloc "Publication" (sidebar droite)
→ Sélectionner un auteur dans la liste déroulante
→ Publier
```

## 📦 Dépendances ajoutées

```bash
npm install bcryptjs @types/bcryptjs
```

## 🔄 Prochaines étapes (optionnel)

- [ ] Implémenter les vraies permissions par rôle
- [ ] Afficher le nom de l'auteur sur les articles publiés
- [ ] Page de profil utilisateur (modifier son propre profil)
- [ ] Filtrer les contenus par auteur dans l'admin
- [ ] Statistiques par auteur (nombre d'articles, etc.)

---

**Tous les fichiers sont en place et fonctionnels !** 🎉

Tu peux maintenant :
1. Créer des utilisateurs
2. Les affecter à des sites avec différents rôles
3. Sélectionner l'auteur lors de la création d'un article
