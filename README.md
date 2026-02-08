# Foundry 🚀

**Plateforme CMS multi-sites performante et scalable**

Une plateforme multi-sites pour gérer un portefeuille de sites éditoriaux de manière industrielle, performante et maîtrisée.

---

## ✨ Fonctionnalités

### 🏢 Multi-sites
- Créer des sites en quelques clics
- Gérer plusieurs domaines par site (principal + alias)
- Résolution automatique par hostname
- Pas de redéploiement nécessaire

### 📝 Gestion de contenu
- Articles et pages avec éditeur HTML
- Brouillons et publications
- Catégories et tags
- Image à la une
- Gestion des médias avec Supabase Storage

### 🎨 Frontend optimisé
- Server-Side Rendering (SSR)
- Images optimisées (next/image)
- SEO dynamique (métadonnées, Open Graph)
- Sitemap.xml et robots.txt automatiques

### 🛠️ Administration complète
- Dashboard avec statistiques
- Gestion des sites et domaines
- Éditeur de contenu intuitif
- Galerie de médias
- Taxonomies (catégories/tags)

---

## 🚀 Quick Start

### Prérequis

- Node.js 18+
- Un compte Supabase (gratuit)

### Installation

```bash
# 1. Cloner et installer
git clone <votre-repo>
cd foundry
npm install

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 3. Créer la base de données
# Aller sur supabase.com > SQL Editor
# Copier-coller le contenu de lib/db/schema.sql

# 4. Créer le bucket Storage
# Voir docs/SUPABASE_STORAGE.md

# 5. Lancer le serveur
npm run dev
```

**Accès :**
- Admin : http://localhost:3000/
- Site de test : http://dev.localhost:3000/ (après seed data)

📖 **Guide détaillé** : `SUPABASE_SETUP.md`

---

## 📦 Architecture

### Multi-tenant
- **1 codebase** pour tous les sites
- **1 base de données** avec scoping par `site_id`
- **Résolution par domaine** via middleware Next.js
- **Cache en mémoire** pour la résolution des sites

### Stack technique
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript 5
- **Base de données** : PostgreSQL (Supabase)
- **Storage** : Supabase Storage
- **Styling** : Tailwind CSS 3
- **Déploiement** : Vercel (recommandé)

### Structure du projet

```
foundry/
├── app/
│   ├── (public)/          # Frontend public des sites
│   │   ├── page.tsx       # Homepage
│   │   ├── [slug]/        # Articles et pages
│   │   ├── category/      # Pages de catégories
│   │   └── tag/           # Pages de tags
│   ├── admin/             # Interface d'administration
│   │   ├── page.tsx       # Dashboard
│   │   ├── sites/         # Gestion des sites
│   │   ├── content/       # Gestion du contenu
│   │   ├── terms/         # Taxonomies
│   │   └── media/         # Galerie de médias
│   └── api/admin/         # API routes
├── lib/
│   ├── core/              # Multi-tenancy, site resolver
│   ├── db/                # Client Supabase, queries, types
│   └── ui/                # Composants UI
├── middleware.ts          # Résolution de site par hostname
└── docs/                  # Documentation complète
```

---

## 🎯 Usage

### Créer un site

1. Aller sur `/admin/sites/new`
2. Remplir le nom et le thème
3. Cliquer sur "Créer le site"
4. Ajouter un domaine (ex: `monsite.localhost` en dev)

### Créer du contenu

1. Aller sur `/admin/content/new`
2. Sélectionner le site
3. Choisir le type (Article ou Page)
4. Remplir les champs
5. Associer une catégorie et des tags
6. Sélectionner une image à la une
7. Publier ou sauvegarder en brouillon

### Upload de médias

1. Aller sur `/admin/media`
2. Sélectionner le site
3. Choisir un fichier image (JPG, PNG, GIF, WebP)
4. Upload
5. Copier l'URL ou utiliser dans un article

---

## 🌐 Configuration des domaines

### Développement local

```
localhost:3000              → Redirige vers /admin
dev.localhost:3000          → Site "Mon Site Dev"
monsite.localhost:3000      → Site personnalisé
```

Les domaines `*.localhost` fonctionnent nativement sur la plupart des systèmes.

### Production

1. Créer un site dans l'admin
2. Ajouter un domaine (ex: `monsite.com`)
3. Définir comme domaine principal
4. Configurer le DNS pour pointer vers votre serveur
5. Configurer Cloudflare ou votre proxy

📖 **Guide détaillé** : `docs/DOMAINS_LOGIC.md`

---

## 📊 Base de données

### Tables principales

- `sites` - Sites et leur configuration
- `domains` - Domaines associés aux sites
- `content` - Articles et pages
- `terms` - Catégories et tags
- `term_relations` - Relations contenu-termes
- `media` - Fichiers médias
- `users` - Utilisateurs (structure prête)
- `memberships` - Permissions (structure prête)
- `menus` - Menus (structure prête)

**Schéma complet** : `lib/db/schema.sql`

---

## 🔐 Sécurité

- Service role key côté serveur uniquement
- Anon key côté client (protégé par RLS)
- Validation des entrées (slugs, hostnames)
- Noms de fichiers randomisés dans Storage
- HTML sanitisé (tags limités)

---

## 🚢 Déploiement

### Vercel (recommandé)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Configurer les variables d'environnement dans Vercel Dashboard
```

### Serveur dédié

```bash
# 1. Build
npm run build

# 2. Lancer en production
npm start
```

**Configuration :**
- Variables d'environnement (voir `.env.example`)
- Proxy inverse (Nginx, Cloudflare)
- SSL/TLS activé

---

## 📚 Documentation

- `SUPABASE_SETUP.md` - Configuration Supabase complète
- `GETTING_STARTED.md` - Guide de démarrage
- `STATUS_FINAL.md` - État complet du développement
- `docs/SUPABASE_STORAGE.md` - Configuration du bucket media
- `docs/DOMAINS_LOGIC.md` - Résolution des domaines
- `docs/TAXONOMIES_COMPLETE.md` - Système de taxonomies
- `docs/MEDIA_COMPLETE.md` - Système de médias

---

## 🎯 Philosophie

Foundry n'est pas un CMS générique. C'est un outil propriétaire conçu pour :

- **Performance** (Core Web Vitals, SSR, cache)
- **Scalabilité** (multi-sites, 100+ sites possibles)
- **Automatisation** (workflows éditoriaux)
- **Contrôle** (qualité éditoriale stricte)
- **Maintenabilité** (TypeScript, architecture propre)

Chaque décision technique est évaluée selon ces critères.

---

## 🛠️ Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm start            # Lancer le build
npm run type-check   # Vérifier TypeScript
npm run lint         # Linter
```

---

## 🎉 Statut du projet

✅ **MVP complet et opérationnel**

Fonctionnalités développées :
- Multi-sites avec gestion de domaines
- CRUD complet pour le contenu
- Taxonomies (catégories et tags)
- Médias avec Supabase Storage
- Frontend dynamique avec SEO
- Admin complet et intuitif

**Prochaines étapes optionnelles :**
- Authentification admin
- Gestion des permissions
- Menus personnalisés
- Module IA (génération de contenu)

---

## 📄 Licence

Propriétaire - Usage interne uniquement

---

## 🤝 Support

Pour toute question ou problème :
1. Consulter la documentation dans `/docs`
2. Vérifier `STATUS_FINAL.md` pour l'état du projet
3. Consulter les logs de développement

---

**Développé avec ❤️ et Next.js**
