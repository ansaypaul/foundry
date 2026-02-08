/**
 * Wrapper API Vercel
 * Gère l'ajout de domaines aux projets Vercel et la vérification de leur validation
 */

import { VERCEL_TOKEN, VERCEL_TEAM_ID } from '../env';

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelError {
  code: string;
  message: string;
}

interface VercelErrorResponse {
  error: VercelError;
}

interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  gitBranch?: string | null;
  redirect?: string | null;
  redirectStatusCode?: number | null;
}

/**
 * Construit l'URL de l'API Vercel avec le teamId si nécessaire
 */
function buildVercelUrl(path: string): string {
  const url = new URL(`${VERCEL_API_BASE}${path}`);
  if (VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', VERCEL_TEAM_ID);
  }
  return url.toString();
}

/**
 * Effectue une requête à l'API Vercel
 */
async function vercelRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN non configuré');
  }

  const url = buildVercelUrl(endpoint);
  
  console.log(`[Vercel] ${method} ${endpoint}${VERCEL_TEAM_ID ? ` (team: ${VERCEL_TEAM_ID})` : ''}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  // Gestion des erreurs Vercel
  if (!response.ok) {
    const errorData = data as VercelErrorResponse;
    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
    console.error(`[Vercel] Erreur API:`, errorMsg);
    throw new Error(`Vercel API error: ${errorMsg}`);
  }

  return data as T;
}

/**
 * Ajoute un domaine à un projet Vercel
 * Idempotent: si le domaine existe déjà, ne lance pas d'erreur
 */
export async function addDomainToProject(
  projectId: string,
  domain: string
): Promise<VercelDomain> {
  try {
    const result = await vercelRequest<VercelDomain>(
      `/v10/projects/${projectId}/domains`,
      'POST',
      {
        name: domain,
      }
    );

    console.log(`[Vercel] Domaine ajouté: ${domain} au projet ${projectId}`);
    return result;
  } catch (error) {
    // Si le domaine existe déjà, récupérer son statut au lieu de planter
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`[Vercel] Domaine ${domain} existe déjà, récupération du statut...`);
      return await getDomainStatus(projectId, domain);
    }
    
    console.error('[Vercel] addDomainToProject error:', error);
    throw error;
  }
}

/**
 * Récupère le statut de validation d'un domaine
 */
export async function getDomainStatus(
  projectId: string,
  domain: string
): Promise<VercelDomain> {
  try {
    const result = await vercelRequest<VercelDomain>(
      `/v9/projects/${projectId}/domains/${domain}`
    );
    return result;
  } catch (error) {
    console.error('[Vercel] getDomainStatus error:', error);
    throw error;
  }
}

/**
 * Vérifie si un domaine est validé par Vercel
 */
export async function isDomainVerified(
  projectId: string,
  domain: string
): Promise<boolean> {
  try {
    const domainInfo = await getDomainStatus(projectId, domain);
    return domainInfo.verified;
  } catch (error) {
    console.error('[Vercel] isDomainVerified error:', error);
    return false;
  }
}

/**
 * Ajoute à la fois le domaine apex et www à un projet
 * Retourne les statuts des deux domaines
 */
export async function addDomainWithWWW(
  projectId: string,
  domain: string
): Promise<{
  apex: VercelDomain;
  www: VercelDomain;
}> {
  try {
    // Ajouter le domaine apex
    const apex = await addDomainToProject(projectId, domain);
    
    // Ajouter www
    const www = await addDomainToProject(projectId, `www.${domain}`);

    console.log(`[Vercel] Domaines apex et www ajoutés pour ${domain}`);

    return { apex, www };
  } catch (error) {
    console.error('[Vercel] addDomainWithWWW error:', error);
    throw error;
  }
}

/**
 * Vérifie le statut de validation pour apex et www
 */
export async function checkDomainValidation(
  projectId: string,
  domain: string
): Promise<{
  apexVerified: boolean;
  wwwVerified: boolean;
  allVerified: boolean;
}> {
  try {
    const [apexVerified, wwwVerified] = await Promise.all([
      isDomainVerified(projectId, domain),
      isDomainVerified(projectId, `www.${domain}`),
    ]);

    return {
      apexVerified,
      wwwVerified,
      allVerified: apexVerified && wwwVerified,
    };
  } catch (error) {
    console.error('[Vercel] checkDomainValidation error:', error);
    return {
      apexVerified: false,
      wwwVerified: false,
      allVerified: false,
    };
  }
}
