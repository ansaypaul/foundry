# Foundry – Project Overview

## Résumé exécutif
Foundry est une plateforme interne permettant de créer, gérer et exploiter un portefeuille de sites éditoriaux de manière industrielle, performante et maîtrisée.

Le projet vise à remplacer une gestion éclatée de multiples CMS (ex: plusieurs WordPress) par une application unique, multi-sites, conçue dès le départ pour :
- la performance
- la scalabilité
- l’automatisation
- l’assistance par intelligence artificielle
- le contrôle éditorial et SEO

Foundry n’est pas destiné à être distribué publiquement.
C’est un outil propriétaire, orienté productivité et qualité.

---

## Problématique initiale

La gestion de nombreux sites via des CMS traditionnels pose plusieurs problèmes :
- maintenance lourde (mises à jour, sécurité, plugins)
- performances inégales
- automatisation difficile
- duplication de configurations
- risques de footprints techniques
- coûts humains élevés à partir d’un certain volume

À partir d’une dizaine de sites, ces contraintes deviennent structurelles.

Foundry répond à ce problème par une approche centralisée et multi-tenant.

---

## Vision long terme

À terme, Foundry doit permettre de :
- gérer 100+ sites depuis une seule interface
- créer un nouveau site en quelques minutes
- générer un site complet (structure, pages, catégories, contenu) de façon assistée
- maintenir des performances élevées sur l’ensemble du portefeuille
- garder un contrôle strict sur la qualité et la cohérence éditoriale
- faire évoluer les sites sans redéploiement constant

---

## Concept clé : Multi-site natif

Foundry repose sur un principe fondamental :

Il n’existe qu’une seule application.
Les sites sont des entités de données, pas des instances logicielles.

La différenciation entre les sites se fait par :
- le domaine
- la configuration
- les templates
- le contenu

Chaque requête est associée à un `site_id` déterminé à partir du domaine.

---

## Architecture globale (vue logique)

Utilisateur
↓
Domaine (ex: siteA.com)
↓
Cloudflare / Proxy
↓
Application Foundry (Next.js)
↓
Résolution du site via le Host header
↓
Chargement de la configuration du site
↓
Rendu du contenu correspondant

Toutes les routes publiques et admin suivent ce principe.

---

## Gestion des sites

Un site dans Foundry correspond à :
- un ou plusieurs domaines
- un thème (template)
- une configuration visuelle
- une ligne éditoriale
- un ensemble de contenus

Créer un site consiste uniquement à :
- créer une entrée en base
- associer un domaine
- définir une configuration initiale

Aucun déploiement n’est requis.

---

## Gestion des domaines

Les domaines sont stockés en base de données et liés à un site.

Fonctionnalités prévues :
- domaine primaire
- domaines alias
- redirections automatiques
- gestion www / apex
- support de domaines de préproduction

La résolution du site repose exclusivement sur le Host header.

---

## Modèle de contenu

Foundry gère deux types principaux de contenu :
- pages
- articles

Chaque contenu :
- appartient à un site
- possède un slug unique par site
- peut être publié ou en brouillon
- est rendu via un template choisi

Le modèle est volontairement plus simple que WordPress afin de :
- limiter la complexité
- améliorer les performances
- faciliter l’automatisation

---

## Templates et thèmes

Foundry adopte une approche “WordPress-like” maîtrisée :

- un nombre limité de templates codés
- sélection du template par site
- possibilité de changer de template sans redéployer
- variations via configuration (JSON)

Les templates définissent :
- la structure de la home
- l’affichage des articles
- l’affichage des catégories
- certains blocs optionnels

---

## Back-office (Admin)

Foundry intègre un back-office interne permettant de :
- gérer les sites
- gérer les domaines
- créer et publier du contenu
- gérer les catégories et tags
- gérer les médias

L’admin privilégie :
- la rapidité
- la clarté
- l’efficacité

Il ne cherche pas à reproduire toutes les fonctionnalités d’un CMS grand public.

---

## Intelligence artificielle (vision)

L’IA est un composant central mais contrôlé.

Elle intervient pour :
- définir la ligne éditoriale d’un site
- générer des pages obligatoires
- proposer des catégories cohérentes
- produire des plans et des brouillons
- assister à la mise à jour de contenus existants

L’IA ne publie jamais sans règles explicites.
Chaque action IA est traçable et versionnée.

---

## Workflow type : création d’un site

1. Création du site en admin
2. Association d’un domaine
3. Génération du playbook éditorial
4. Génération des pages obligatoires
5. Génération des catégories
6. Création des premiers articles
7. Publication progressive

À chaque étape, un contrôle est possible.

---

## Performances et SEO

Foundry est conçu pour exceller techniquement :

- rendu SSR ou ISR
- HTML minimal
- images optimisées
- cache intelligent
- structure SEO maîtrisée
- sitemaps par site
- métadonnées dynamiques

L’objectif est d’obtenir de très bons Core Web Vitals de façon systémique.

---

## Sécurité et robustesse

- aucune logique basée sur l’IP
- validation stricte des entrées
- accès admin protégé
- séparation claire front / mutations
- logs pour les actions sensibles

---

## Évolutivité

Foundry est conçu pour évoluer sans remise en cause de son socle :
- ajout de nouveaux templates
- ajout de nouveaux workflows IA
- montée en charge du nombre de sites
- intégration d’outils externes (Make, APIs, etc.)

Toute nouvelle fonctionnalité doit respecter :
- le multi-tenant
- la performance
- la simplicité d’usage

---

## Philosophie finale

Foundry n’est pas un projet expérimental.
C’est un outil stratégique pensé pour durer.

Chaque choix doit être justifié par :
- la scalabilité
- la lisibilité
- la maintenabilité
- la performance
- la capacité à automatiser sans dégrader la qualité
