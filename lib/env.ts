/**
 * Centralisation et validation des variables d'environnement
 * Foundry - Domain Push Automation
 */

// Variables d'environnement requises pour Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Variables d'environnement pour Cloudflare
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Variables d'environnement pour Vercel
export const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
export const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optionnel
export const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

/**
 * Valide que toutes les variables d'environnement requises pour le Domain Push sont présentes
 * @throws Error si une variable requise est manquante
 */
export function validateDomainPushEnv(): void {
  const errors: string[] = [];

  if (!CLOUDFLARE_API_TOKEN) {
    errors.push('CLOUDFLARE_API_TOKEN est manquant');
  }

  if (!CLOUDFLARE_ACCOUNT_ID) {
    errors.push('CLOUDFLARE_ACCOUNT_ID est manquant');
  }

  if (!VERCEL_TOKEN) {
    errors.push('VERCEL_TOKEN est manquant');
  }

  if (!VERCEL_PROJECT_ID) {
    errors.push('VERCEL_PROJECT_ID est manquant');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration Domain Push incomplète:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Consultez .env.example pour les variables requises.`
    );
  }
}

/**
 * Valide que les variables d'environnement Supabase sont présentes
 * @throws Error si une variable requise est manquante
 */
export function validateSupabaseEnv(): void {
  const errors: string[] = [];

  if (!SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL est manquant');
  }

  if (!SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY est manquant');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration Supabase incomplète:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}
