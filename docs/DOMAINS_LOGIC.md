# Configuration des domaines Foundry

## 🎯 Logique de résolution

### localhost (sans sous-domaine)
**URL** : `http://localhost:3000`  
**Affiche** : Interface d'administration (redirection automatique vers `/admin`)

**Pourquoi ?**
- C'est l'URL la plus simple à taper
- C'est là que vous gérez vos sites
- Pas besoin de domaine dans la base de données

### Sous-domaines .localhost
**URLs** : 
- `http://boulette.localhost:3000`
- `http://recettes.localhost:3000`
- `http://blog.localhost:3000`

**Affiche** : Le site éditorial correspondant

**Configuration requise** :
- Créer le site dans l'admin
- Ajouter le domaine (ex: `boulette.localhost`)

## 📋 Tableau récapitulatif

| URL | Affiche | Configuration BDD requise |
|-----|---------|---------------------------|
| `localhost:3000` | Admin | ❌ Non (redirection automatique) |
| `boulette.localhost:3000` | Site Boulette.fr | ✅ Oui (domaine dans la table domains) |
| `recettes.localhost:3000` | Site Recettes | ✅ Oui (domaine dans la table domains) |
| `blog.localhost:3000` | Site Blog | ✅ Oui (domaine dans la table domains) |

## 🔄 Workflow typique

### 1. Gestion des sites
```
http://localhost:3000
   ↓
Redirection automatique vers /admin
   ↓
Dashboard avec liste des sites
```

### 2. Création d'un site
```
1. Aller sur http://localhost:3000 (→ admin)
2. Cliquer "Nouveau site"
3. Créer "Boulette.fr"
4. Ajouter le domaine "boulette.localhost"
5. Tester sur http://boulette.localhost:3000
```

### 3. Accès rapide
```
Admin : http://localhost:3000
Site 1 : http://boulette.localhost:3000
Site 2 : http://recettes.localhost:3000
Site 3 : http://blog.localhost:3000
```

## 🎨 Avantages de cette approche

### ✅ Simplicité
- Pas besoin de retenir un domaine spécial pour l'admin
- `localhost` = admin (logique et évident)

### ✅ Séparation claire
- Admin et sites éditoriaux sont bien séparés
- Pas de confusion entre gestion et contenu public

### ✅ Développement efficace
- Basculer rapidement entre admin et sites
- Plusieurs onglets ouverts facilement

## 🔧 Configuration en production

### Développement
```
Admin : localhost:3000
Sites : *.localhost:3000
```

### Production
```
Admin : admin.foundry.com (domaine dédié)
Sites : boulette.fr, recettes.com, blog.net (domaines réels)
```

## 💡 Notes importantes

### Pas de domaine "localhost" en BDD
Le domaine `localhost` **n'existe pas** dans la table `domains`.  
La redirection vers `/admin` est **codée en dur** dans le code pour simplifier.

### Suppression de l'ancien comportement
Avant : `localhost` affichait le "Site de développement"  
Maintenant : `localhost` redirige vers l'admin

### Migration
Si vous aviez déjà configuré `localhost` dans votre BDD :
```sql
DELETE FROM domains WHERE hostname = 'localhost';
```

## 🎯 Exemple concret

### Créer 3 sites

1. **Boulette.fr** → `boulette.localhost`
2. **Recettes du Chef** → `recettes.localhost`
3. **Blog Tech** → `tech.localhost`

### Naviguer

```bash
# Gérer tous les sites
http://localhost:3000

# Voir Boulette.fr
http://boulette.localhost:3000

# Voir Recettes du Chef
http://recettes.localhost:3000

# Voir Blog Tech
http://tech.localhost:3000
```

### Un seul serveur, plusieurs sites !
Tous ces sites tournent sur le **même serveur** Node.js.  
La différenciation se fait par le domaine uniquement. 🚀
