# Foundry – Project Foundation

## Vision
Foundry est une plateforme interne permettant de créer, gérer et faire évoluer un portefeuille de sites éditoriaux de manière industrielle, propre et performante.

Foundry n’est pas un CMS générique.
Foundry est un système orienté :
- multi-sites
- performance
- automatisation
- qualité éditoriale
- contrôle total de la chaîne de publication

## Objectifs principaux
- Créer des sites rapidement sans redéploiement
- Gérer des dizaines de sites depuis une seule application
- Garantir de très bonnes performances (Core Web Vitals)
- Éviter les footprints techniques ou éditoriaux involontaires
- Permettre une génération de contenu assistée par IA, avec garde-fous

## Ce que Foundry n’est PAS
- Un clone complet de WordPress
- Une plateforme ouverte à des plugins tiers
- Un système orienté “no-code”
- Un générateur de spam ou de liens

## Principes techniques non négociables
- Une seule base de code
- Une seule base de données multi-tenant
- Toutes les données sont scoppées par `site_id`
- Le site courant est toujours résolu via le domaine (Host header)
- Aucun contenu ne dépend de fichiers statiques par site
- Aucun déploiement n’est requis pour créer ou modifier un site

## Performance
- Pages rendues en SSR ou ISR
- Aucune logique bloquante inutile dans le rendu
- Images optimisées systématiquement
- Cache intelligent (au minimum cache applicatif)
- HTML propre, minimal, sans scripts inutiles

## Multi-tenancy
- Chaque site est identifié par un ou plusieurs domaines
- Les domaines sont stockés en base de données
- La résolution du site se fait via le Host header
- Aucune logique basée sur l’adresse IP

## Sécurité & robustesse
- Validation stricte des entrées
- Aucune confiance implicite dans le client
- Les accès admin sont protégés
- Les opérations sensibles sont loguées

## Conventions de code
- TypeScript partout
- Fonctions pures quand possible
- Pas de logique métier dans les composants UI
- Nommage explicite et cohérent
- Pas de duplication volontaire

## Contraintes éditoriales globales
- Contenu lisible, structuré et utile
- Pas d’emojis dans le contenu
- Pas de tirets longs
- Pas de conclusions artificielles
- HTML propre et contrôlé

## Évolutivité
Foundry doit pouvoir évoluer vers :
- 100+ sites
- génération IA partielle ou totale
- workflows de publication avancés
- monétisation éditoriale propre

Toute décision technique doit être évaluée selon ces critères.
