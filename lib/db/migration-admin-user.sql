-- Migration: Créer l'utilisateur admin par défaut
-- Password: admin123
-- Hash généré avec bcrypt (10 rounds)

-- Supprimer l'utilisateur s'il existe déjà (pour réinitialiser)
DELETE FROM users WHERE email = 'admin@foundry.local';

-- Créer l'utilisateur admin
-- Le hash correspond au mot de passe "admin123"
INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@foundry.local',
  '$2a$10$rKvqDVOxEj9ZxYYPNTFqLOwBHKxN4zJXvO4MZMxRhJqI5VyHhj.Ae',
  'Admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = '$2a$10$rKvqDVOxEj9ZxYYPNTFqLOwBHKxN4zJXvO4MZMxRhJqI5VyHhj.Ae';

-- Vérifier que l'utilisateur existe
SELECT id, email, name, created_at FROM users WHERE email = 'admin@foundry.local';
