-- Migration : Supprimer le domaine localhost si déjà configuré
-- Exécuter ce script dans l'éditeur SQL de Supabase si vous aviez déjà créé la BDD

-- Supprimer le domaine localhost (maintenant géré par redirection automatique)
DELETE FROM domains WHERE hostname = 'localhost';

-- Vérifier que c'est bien supprimé
SELECT * FROM domains;

-- Note : Le site de développement peut rester, mais sans domaine associé
-- localhost redirige automatiquement vers /admin désormais
