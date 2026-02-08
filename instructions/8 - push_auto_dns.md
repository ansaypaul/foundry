# Foundry – Configuration API Cloudflare + Vercel (Secrets, .env, et “Push Domain”)

Ce document explique comment configurer Foundry pour accéder aux API de Cloudflare et Vercel, via des variables d’environnement (.env), afin d’automatiser l’ajout d’un domaine et la configuration DNS au clic sur un bouton “Push domain”.

Objectif final :
- L’utilisateur crée un site dans Foundry (en DB)
- Puis clique sur “Push domain”
- Foundry :
  - crée ou récupère la zone Cloudflare
  - configure les DNS nécessaires pour Vercel
  - ajoute le domaine au projet Vercel
  - vérifie la validation
  - met à jour le statut du site dans Foundry

Ce setup est conçu pour un usage interne au départ (un seul compte Cloudflare + un seul compte Vercel). Il pourra évoluer plus tard vers une gestion multi-organisations avec tokens par org.

---

## 1) Principes importants

### 1.1 Secrets uniquement côté serveur
Les tokens Cloudflare et Vercel ne doivent JAMAIS être exposés au navigateur.
Donc :
- pas de variables préfixées `NEXT_PUBLIC_`
- pas de lecture côté composants React client
- accès uniquement dans :
  - API routes (app router)
  - server actions
  - services backend
  - jobs/queues éventuels

### 1.2 .env comme source unique au début
Pour Foundry (usage interne), le plus simple et le plus robuste :
- `.env.local` en dev
- variables d’environnement configurées dans Vercel (ou l’infra) en prod

### 1.3 Conserver des états (status) en DB
Le “Push domain” n’est pas un unique appel API, mais une suite d’étapes.
Il faut donc enregistrer l’avancement, pour :
- reprendre une config interrompue
- permettre un “Retry” sans tout casser
- afficher un état clair dans l’UI

---

## 2) Variables d’environnement requises

Créer un fichier `.env.local` à la racine (en dev) :

```env
# Cloudflare
CLOUDFLARE_API_TOKEN=cf_xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel
VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxx
# optionnel mais recommandé si tu utilises une Team Vercel
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxx

Règles :

    .env.local doit être dans .gitignore

    ne jamais logger ces valeurs

    ne jamais les renvoyer dans une réponse API

3) Création du token Cloudflare (config manuelle)
3.1 Où créer le token

Dans Cloudflare :

    My Profile

    API Tokens

    Create Token

Utiliser un API Token (recommandé) et éviter la Global API Key.
3.2 Permissions minimales recommandées

Pour le flow “Push domain”, tu as besoin de :

    Zone:Read

    DNS:Edit

Optionnel selon features :

    Zone:Edit (si tu veux modifier des settings de zone comme SSL, etc.)

Au niveau des ressources (Resources) :

    idéalement : limiter à ton compte ou à certaines zones

    pour démarrer : “All zones in account” peut être acceptable si usage interne

3.3 Récupérer l’Account ID

Cloudflare Account ID est souvent visible :

    dans le dashboard

    ou via l’API
    Stocker dans CLOUDFLARE_ACCOUNT_ID.

4) Création du token Vercel (config manuelle)
4.1 Où créer le token

Dans Vercel :

    Settings

    Tokens

    Create

Ce token doit avoir accès aux projets (projects) où tu vas attacher des domaines.
4.2 Team ID (si tu utilises une team)

Si tes projets Vercel sont dans une Team :

    récupérer le Team ID

    définir VERCEL_TEAM_ID

Quand tu appelles l’API Vercel, tu passeras souvent un param teamId.
5) Stockage des IDs côté Foundry

Foundry doit stocker certains IDs pour éviter des recherches coûteuses et faciliter la reprise :

Pour chaque site :

    domain (ex: example.com)

    cloudflare_zone_id (si zone créée ou retrouvée)

    vercel_project_id (ou project name, mais ID mieux)

    status (état du setup)

    last_error (message court)

    timestamps (created_at, updated_at)

6) États recommandés pour le “Push domain” (state machine)

Champ sites.domain_status (ou sites.status_domain) :

    draft

        site créé, domaine enregistré, pas encore poussé

    pushing

        l’orchestrateur travaille

    waiting_nameservers

        zone Cloudflare créée, l’utilisateur doit mettre les NS chez le registrar

    dns_configured

        DNS records Cloudflare créés

    vercel_pending

        domaine ajouté à Vercel mais pas encore validé (DNS propagation)

    live

        Vercel valide le domaine, site opérationnel

    error

        une étape a échoué, retry possible

Important :

    toujours stocker last_error et last_step pour debug

    le bouton UI “Retry” relance l’orchestrateur depuis l’état courant

7) Logique “Push domain” (orchestration)

Le bouton “Push domain” déclenche un endpoint backend, exemple :

    POST /api/sites/{siteId}/push-domain

L’endpoint :

    charge le site en DB

    passe status = pushing

    exécute les étapes ci-dessous en séquence

    met à jour le status final

7.1 Étape Cloudflare : créer ou récupérer la zone

Cas A : domaine pas encore sur Cloudflare

    créer une zone

    récupérer zone_id

    récupérer les nameservers Cloudflare

    passer en waiting_nameservers si la délégation n’est pas active

Cas B : zone déjà existante sur Cloudflare

    retrouver la zone par nom

    stocker zone_id

    continuer directement

7.2 Vérifier la délégation nameservers (si nécessaire)

Si le domaine vient d’être ajouté :

    Cloudflare fournit 2 nameservers

    l’utilisateur doit les mettre chez le registrar

    Foundry doit afficher ces NS dans l’UI

    Foundry doit vérifier périodiquement (polling) quand la zone devient active

Quand c’est OK :

    continuer vers création DNS

7.3 Étape Cloudflare : créer les DNS pour Vercel

Tu as 2 approches courantes :

Approche 1 (souvent pour apex + www) :

    A record : @ vers IP Vercel (si recommandé dans ton setup)

    CNAME : www vers cname.vercel-dns.com

Approche 2 (plus simple si tu utilises CNAME flattening Cloudflare) :

    CNAME : @ vers cname.vercel-dns.com (si Cloudflare supporte selon réglages)

    CNAME : www vers cname.vercel-dns.com

Note :

    Choisir l’approche selon ta stratégie DNS standard pour Foundry

    Documenter clairement dans le code et ne pas mélanger

Après création :

    status = dns_configured

7.4 Étape Vercel : ajouter le domaine au projet

    appeler l’API Vercel pour attacher domain à vercel_project_id

    optionnel : attacher aussi www.domain

Après ajout :

    status = vercel_pending

7.5 Vérifier la validation Vercel

    l’API Vercel permet de vérifier si le domaine est validé

    si pas validé : continuer à vérifier avec backoff (ex: toutes les 15s puis 30s puis 60s)

    quand validé : status = live

8) Architecture code recommandée (Next.js app router)

Structure proposée :

/lib
  /providers
    cloudflare.ts
    vercel.ts
  domainOrchestrator.ts
  env.ts
/app
  /api
    /sites/[id]/push-domain/route.ts

8.1 lib/env.ts

Centraliser la lecture des env vars et valider qu’elles existent.
En cas d’absence :

    throw explicite

    message d’erreur clair

8.2 lib/providers/cloudflare.ts

Wrapper Cloudflare :

    createZone(domain)

    getZoneByName(domain)

    listDNSRecords(zoneId)

    upsertDNSRecord(zoneId, record)

    getZoneNameservers(zoneId)

    isZoneActive(zoneId) ou équivalent

8.3 lib/providers/vercel.ts

Wrapper Vercel :

    addDomainToProject(projectId, domain)

    getDomainStatus(projectId, domain)

    gérer teamId si présent

8.4 lib/domainOrchestrator.ts

Orchestrateur unique :

    prend siteId

    exécute les étapes

    met à jour la DB à chaque étape

    gère retry idempotent

9) Idempotence (très important)

Le bouton “Push domain” peut être cliqué plusieurs fois.
Le flow doit être idempotent :

Cloudflare :

    si la zone existe, ne pas recréer

    si un DNS record existe, le mettre à jour au lieu de créer un doublon

Vercel :

    si le domaine est déjà attaché, considérer OK

    si “already exists”, ne pas traiter comme une erreur fatale

DB :

    toujours reprendre depuis le status actuel

    stocker cloudflare_zone_id dès que possible

10) Gestion d’erreurs et UX
10.1 Erreurs typiques

    token invalide ou permissions insuffisantes

    domaine déjà présent sur un autre compte Cloudflare

    DNS conflict (record existant incompatible)

    Vercel refuse le domaine (déjà attaché ailleurs)

    propagation DNS lente

10.2 UX recommandée

Dans la page site :

    Badge status

    Stepper “Cloudflare -> DNS -> Vercel -> Live”

    En cas waiting_nameservers :

        afficher les nameservers Cloudflare à copier-coller

        un bouton “J’ai mis à jour les NS”

        ou polling automatique

En cas error :

    afficher last_error

    bouton “Retry”

11) Configuration prod (Vercel deploy de Foundry)

Si Foundry est hébergé sur Vercel :

    ajouter les variables d’environnement dans :

        Project Settings

        Environment Variables

    les définir pour :

        Development

        Preview

        Production (au minimum Production)

Ne jamais commiter .env.local.
12) Checklist finale

Avant de coder “Push domain” :

    CLOUDFLARE_API_TOKEN créé

    permissions Cloudflare OK (Zone:Read, DNS:Edit)

    CLOUDFLARE_ACCOUNT_ID récupéré

    VERCEL_TOKEN créé

    VERCEL_TEAM_ID renseigné si team

    table sites prête (domain, zone_id, project_id, status, last_error)

    endpoint POST /api/sites/:id/push-domain en place

    wrappers providers Cloudflare et Vercel

    orchestrateur idempotent

    UI avec status + Retry

13) Notes de scope (ce que Foundry ne peut pas automatiser à 100%)

Si le domaine n’est pas déjà délégué à Cloudflare :

    le changement de nameservers chez le registrar est une action humaine

    Foundry doit guider l’utilisateur et attendre la délégation

Si tu utilises uniquement des sous-domaines sous un domaine déjà chez toi (ex: site1.mondomaine.com) :

    tu peux tout automatiser sans passer par la délégation NS

    c’est instantané ou presque