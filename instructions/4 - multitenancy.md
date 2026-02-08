# Foundry – Multi-Tenancy & Domain Resolution

## Principe
Chaque site est identifié par un ou plusieurs domaines.
Le domaine est la seule clé permettant de déterminer le site courant.

## Résolution du site
- Lecture du Host header
- Priorité à x-forwarded-host si présent
- Normalisation :
  - minuscules
  - suppression du port
  - suppression du www.
  - suppression du point final

## Lookup
- Recherche dans la table domains.hostname
- Récupération du site associé
- Mise en cache courte durée

## Redirections
- Si domaine non primaire et redirect_to_primary = true
- Redirection 301 vers le domaine primaire
- Conservation du path et des query params

## Cas non trouvés
- Domaine inconnu → 404 ou site par défaut
- Aucun fallback implicite

## Sécurité
- Jamais de logique basée sur l’IP
- Jamais de logique basée sur l’URL path pour identifier un site

## Local development
- Utilisation de *.localhost
- Exemple :
  - site1.localhost
  - site2.localhost
