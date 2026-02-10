-- Migration SQL pour créer le trigger webhook Redis sync
-- À exécuter dans Supabase SQL Editor

-- 1. Activer l'extension pg_net si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Créer la fonction qui appelle le webhook
CREATE OR REPLACE FUNCTION sync_redis_on_domain_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- URL du webhook
  webhook_url := 'https://foundry-navy.vercel.app/api/sync-redis';
  
  -- Construire le payload selon le type d'opération
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'type', 'DELETE',
      'old_record', row_to_json(OLD)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
  ELSIF TG_OP = 'INSERT' THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'record', row_to_json(NEW)
    );
  END IF;
  
  -- Appeler le webhook de manière asynchrone
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::text
  );
  
  -- Retourner la nouvelle ligne (ou NULL pour DELETE)
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger sur la table domains
DROP TRIGGER IF EXISTS domains_redis_sync_trigger ON domains;

CREATE TRIGGER domains_redis_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION sync_redis_on_domain_change();

-- 4. Commenter le trigger
COMMENT ON TRIGGER domains_redis_sync_trigger ON domains IS 
  'Synchronise Redis automatiquement quand un domaine est créé, modifié ou supprimé';

-- 5. Test du trigger (optionnel)
-- UPDATE domains SET hostname = hostname WHERE id = (SELECT id FROM domains LIMIT 1);
-- Vérifie les logs de ton API /api/sync-redis pour confirmer que ça marche
