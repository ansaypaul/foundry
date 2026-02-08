# Guide : Gestion des Sites et Domaines

## ✅ Nouvelles fonctionnalités implémentées

### 1. Création de site
**Route** : `/admin/sites/new`

**Fonctionnalités** :
- Formulaire simple avec nom, thème, statut
- Validation côté client et serveur
- Redirection automatique vers la page d'édition après création

**À tester** :
```
1. Aller sur http://localhost:3000/admin/sites
2. Cliquer sur "Nouveau site"
3. Remplir le formulaire :
   - Nom : "Mon Blog Tech"
   - Thème : "default"
   - Statut : "active"
4. Cliquer sur "Créer le site"
5. Vous serez redirigé vers la page d'édition
```

### 2. Édition de site
**Route** : `/admin/sites/[id]`

**Fonctionnalités** :
- Modification du nom, thème, statut
- Affichage des informations (ID, date de création)
- Message de succès après enregistrement
- Gestion des domaines sur la même page

**À tester** :
```
1. Depuis la liste des sites, cliquer sur "Modifier"
2. Changer le nom du site
3. Changer le thème
4. Cliquer sur "Enregistrer"
5. Vérifier le message de succès
```

### 3. Gestion des domaines
**Route** : `/admin/sites/[id]` (section Domaines)

**Fonctionnalités** :
- ✅ Ajouter un domaine
- ✅ Définir un domaine comme principal
- ✅ Supprimer un domaine (sauf le principal)
- ✅ Normalisation automatique des hostnames
- ✅ Validation (pas de doublons)
- ✅ Vidage automatique du cache

**À tester** :
```
1. Dans la page d'édition d'un site
2. Ajouter un domaine : "tech.localhost"
3. Ajouter un autre : "blog.localhost"
4. Définir "blog.localhost" comme principal
5. Supprimer "tech.localhost"
6. Tester dans le navigateur :
   - http://blog.localhost:3000 → devrait afficher le site
```

## 📋 API Routes créées

### Sites
- `POST /api/admin/sites` - Créer un site
- `PATCH /api/admin/sites/[id]` - Mettre à jour un site

### Domaines
- `POST /api/admin/domains` - Ajouter un domaine
- `PATCH /api/admin/domains/[id]/set-primary` - Définir comme principal
- `DELETE /api/admin/domains/[id]` - Supprimer un domaine

## 🧪 Scénario de test complet

### 1. Créer un nouveau site
```
Nom : Blog Cuisine
Thème : default
Statut : active
```

### 2. Ajouter des domaines
```
1. cuisine.localhost (sera automatiquement principal)
2. recettes.localhost
3. cooking.localhost
```

### 3. Changer le domaine principal
```
Définir "recettes.localhost" comme principal
```

### 4. Tester la résolution
```
- http://cuisine.localhost:3000 → Blog Cuisine
- http://recettes.localhost:3000 → Blog Cuisine
- http://cooking.localhost:3000 → Blog Cuisine
```

### 5. Vérifier le multi-tenant
```
- Créer un article via l'admin (quand disponible)
- Vérifier qu'il apparaît seulement sur ce site
- Pas sur les autres sites
```

## 🎯 Fonctionnalités implémentées (Point 5 - Admin)

### ✅ Sites
- [x] Liste des sites
- [x] Création d'un site
- [x] Modification (nom, thème, statut)

### ✅ Domaines
- [x] Ajout de domaines
- [x] Définir le domaine primaire
- [x] Supprimer des domaines
- [x] Validation et normalisation

### ❌ Reste à faire
- [ ] Contenu (CRUD articles/pages)
- [ ] Taxonomies (catégories/tags)
- [ ] Médias (upload)
- [ ] Authentification admin

## 💡 Notes importantes

### Cache
Le cache de résolution de domaine est **automatiquement vidé** quand vous :
- Ajoutez un domaine
- Supprimez un domaine
- Changez le domaine principal

### Domaines .localhost
Les domaines en `.localhost` fonctionnent **immédiatement** sans configuration :
- `monsite.localhost:3000`
- `blog.localhost:3000`
- `portfolio.localhost:3000`

### Validation
- Les hostnames sont automatiquement normalisés (minuscules, suppression www, port, etc.)
- Impossible de supprimer le domaine principal
- Impossible d'avoir des doublons de domaines

## 🐛 Troubleshooting

### Le site ne s'affiche pas
1. Vérifier que le domaine existe dans la table `domains`
2. Vérifier que le site est `active`
3. Vider le cache du navigateur
4. Redémarrer le serveur de dev

### Erreur "Ce domaine existe déjà"
Le hostname est déjà utilisé par un autre site. Choisissez-en un autre.

### Le domaine principal ne peut pas être supprimé
Normal ! Définissez d'abord un autre domaine comme principal.

## 🚀 Prochaine étape

Maintenant que la gestion des sites est complète, nous pouvons implémenter la **gestion du contenu** (articles et pages) !
