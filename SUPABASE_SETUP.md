# Configuration Supabase pour Foundry

Ce guide vous aidera à configurer Supabase pour Foundry.

## 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com) et connectez-vous
2. Cliquez sur "New Project"
3. Choisissez un nom, un mot de passe pour la base de données et une région
4. Attendez que le projet soit créé (2-3 minutes)

## 2. Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Copiez les valeurs suivantes :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (dans "Project API keys") → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (dans "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important** : La clé `service_role` donne un accès complet à votre base de données. Ne la commitez jamais dans Git et ne l'exposez jamais côté client.

## 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Créer le schéma de la base de données

### Option A : Via l'interface Supabase (recommandé)

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Copiez tout le contenu du fichier `lib/db/schema.sql`
4. Collez-le dans l'éditeur
5. Cliquez sur "Run" pour exécuter le script

### Option B : Via Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

## 5. Vérifier l'installation

1. Allez dans **Table Editor** dans Supabase
2. Vous devriez voir toutes les tables créées :
   - sites
   - domains
   - users
   - memberships
   - content
   - terms
   - term_relations
   - media
   - menus
   - ai_jobs

3. Vérifiez que le site de développement par défaut existe :
   - Dans la table `sites`, vous devriez avoir un site "Site de développement"
   - Dans la table `domains`, vous devriez avoir le domaine "localhost"

## 6. Configurer les politiques RLS (Row Level Security)

Par défaut, Supabase active la sécurité au niveau des lignes (RLS). Pour Foundry, nous utilisons la clé `service_role` côté serveur, ce qui bypass les politiques RLS.

Si vous souhaitez activer RLS pour plus de sécurité :

1. Allez dans **Authentication** > **Policies**
2. Pour chaque table, créez des politiques appropriées

Exemple de politique pour la table `content` :

```sql
-- Politique de lecture : tout le monde peut lire le contenu publié
CREATE POLICY "Public can read published content"
ON content FOR SELECT
USING (status = 'published');

-- Politique d'écriture : seuls les utilisateurs authentifiés avec le bon rôle
CREATE POLICY "Users can manage content for their sites"
ON content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.user_id = auth.uid()
    AND memberships.site_id = content.site_id
  )
);
```

## 7. Configuration du domaine localhost

Le schéma SQL crée automatiquement :
- Un site de développement
- Le domaine `localhost` pointant vers ce site
- Un utilisateur admin (email: `admin@foundry.local`, mot de passe: `admin123`)

⚠️ **Changez ce mot de passe en production !**

## 8. Tester l'installation

Lancez l'application :

```bash
npm run dev
```

Allez sur http://localhost:3000 - vous devriez voir :
- La page d'accueil du site de développement
- Lien vers `/admin` pour accéder à l'administration

## 9. Configuration avancée

### Stockage des médias (Supabase Storage)

Pour gérer les uploads d'images, configurez Supabase Storage :

1. Allez dans **Storage** dans Supabase
2. Créez un bucket "media"
3. Configurez les politiques d'accès

### Edge Functions (à venir)

Pour les tâches d'IA et les workflows avancés, vous pourrez utiliser les Edge Functions de Supabase.

## Troubleshooting

### Erreur : "Missing Supabase environment variables"

Vérifiez que votre fichier `.env.local` contient bien toutes les variables nécessaires.

### Erreur : "relation does not exist"

Le schéma n'a pas été créé correctement. Retournez à l'étape 4 et réexécutez le script SQL.

### Erreur de connexion

Vérifiez que :
- Votre projet Supabase est bien actif
- Les URLs et clés sont correctes
- Vous n'avez pas de pare-feu bloquant les connexions

## Régénérer les types TypeScript

Après avoir modifié le schéma, régénérez les types :

```bash
npx supabase gen types typescript --project-id votre-project-ref > lib/db/database.types.ts
```

## Support

Pour plus d'informations sur Supabase :
- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
