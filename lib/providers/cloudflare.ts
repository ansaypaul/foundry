/**
 * Wrapper API Cloudflare
 * Gère les zones et DNS records pour le Domain Push automation
 */

import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '../env';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareError {
  code: number;
  message: string;
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: CloudflareError[];
  messages: string[];
  result: T;
}

interface CloudflareZone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  name_servers: string[];
  account?: {
    id: string;
    name: string;
  };
}

interface CloudflareDNSRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}

/**
 * Effectue une requête à l'API Cloudflare
 */
async function cloudflareRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  // Guard: vérifier que le token existe et n'est pas vide
  if (!CLOUDFLARE_API_TOKEN || CLOUDFLARE_API_TOKEN.trim() === '') {
    console.error('[Cloudflare] Token manquant ou vide');
    console.error('Token present:', Boolean(CLOUDFLARE_API_TOKEN));
    console.error('Token length:', CLOUDFLARE_API_TOKEN?.length);
    throw new Error('CLOUDFLARE_API_TOKEN non configuré ou vide');
  }

  const url = `${CLOUDFLARE_API_BASE}${endpoint}`;
  
  // Logs de debug temporaires
  console.log(`[Cloudflare] ${method} ${endpoint}`);
  console.log('[Cloudflare DEBUG] Token present:', Boolean(CLOUDFLARE_API_TOKEN));
  console.log('[Cloudflare DEBUG] Token length:', CLOUDFLARE_API_TOKEN.length);
  console.log('[Cloudflare DEBUG] Token starts with:', CLOUDFLARE_API_TOKEN.substring(0, 10) + '...');

  // Headers minimalistes - UNIQUEMENT Bearer token
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  console.log('[Cloudflare DEBUG] Headers:', Object.keys(headers));

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('[Cloudflare DEBUG] Response status:', response.status);

  const data: CloudflareResponse<T> = await response.json();

  if (!data.success || data.errors.length > 0) {
    const errorMsg = data.errors.map(e => `${e.code}: ${e.message}`).join(', ');
    console.error(`[Cloudflare] Erreur API:`, errorMsg);
    console.error('[Cloudflare] Full error details:', JSON.stringify(data.errors, null, 2));
    throw new Error(`Cloudflare API error: ${errorMsg || 'Unknown error'}`);
  }

  return data.result;
}

/**
 * Vérifie si une zone existe déjà pour un domaine donné
 */
export async function getZoneByName(domain: string): Promise<CloudflareZone | null> {
  try {
    const zones = await cloudflareRequest<CloudflareZone[]>(
      `/zones?name=${encodeURIComponent(domain)}`
    );

    if (zones.length === 0) {
      return null;
    }

    return zones[0];
  } catch (error) {
    console.error('[Cloudflare] getZoneByName error:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle zone Cloudflare
 */
export async function createZone(domain: string): Promise<{
  zoneId: string;
  nameservers: string[];
  status: string;
}> {
  if (!CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID non configuré');
  }

  try {
    const zone = await cloudflareRequest<CloudflareZone>('/zones', 'POST', {
      name: domain,
      account: {
        id: CLOUDFLARE_ACCOUNT_ID,
      },
      jump_start: true, // Auto-scan des DNS existants
    });

    console.log(`[Cloudflare] Zone créée: ${zone.id} (${zone.status})`);

    return {
      zoneId: zone.id,
      nameservers: zone.name_servers,
      status: zone.status,
    };
  } catch (error) {
    console.error('[Cloudflare] createZone error:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une zone (active ou non)
 */
export async function isZoneActive(zoneId: string): Promise<boolean> {
  try {
    const zone = await cloudflareRequest<CloudflareZone>(`/zones/${zoneId}`);
    return zone.status === 'active';
  } catch (error) {
    console.error('[Cloudflare] isZoneActive error:', error);
    throw error;
  }
}

/**
 * Récupère les nameservers d'une zone
 */
export async function getZoneNameservers(zoneId: string): Promise<string[]> {
  try {
    const zone = await cloudflareRequest<CloudflareZone>(`/zones/${zoneId}`);
    return zone.name_servers;
  } catch (error) {
    console.error('[Cloudflare] getZoneNameservers error:', error);
    throw error;
  }
}

/**
 * Liste tous les DNS records d'une zone
 */
export async function listDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
  try {
    const records = await cloudflareRequest<CloudflareDNSRecord[]>(
      `/zones/${zoneId}/dns_records`
    );
    return records;
  } catch (error) {
    console.error('[Cloudflare] listDNSRecords error:', error);
    throw error;
  }
}

/**
 * Crée ou met à jour un DNS record (upsert)
 * Si un record existe avec le même type et name, il est mis à jour
 */
export async function upsertDNSRecord(
  zoneId: string,
  record: CloudflareDNSRecord
): Promise<CloudflareDNSRecord> {
  try {
    // Récupérer les records existants
    const existingRecords = await listDNSRecords(zoneId);
    
    // Normaliser le nom pour la comparaison
    // @ devient le nom de la zone, sinon on cherche le nom exact ou avec le domaine
    const recordNameToMatch = record.name === '@' ? '@' : record.name;
    
    // Chercher un record avec le même type et name
    const existing = existingRecords.find(r => {
      // Comparer les types
      if (r.type !== record.type) return false;
      
      // Comparer les noms (gérer @ et les noms complets)
      if (recordNameToMatch === '@') {
        // Pour @, chercher le nom qui correspond à la zone root
        return r.name === '@' || !r.name.includes('.');
      }
      
      // Pour les autres, comparer directement
      return r.name === recordNameToMatch || r.name.startsWith(recordNameToMatch + '.');
    });

    if (existing) {
      // Vérifier si le contenu est déjà correct
      if (existing.content === record.content && existing.proxied === (record.proxied ?? false)) {
        console.log(`[Cloudflare] DNS record déjà correct: ${record.type} ${record.name} -> ${record.content}`);
        return existing;
      }

      // Mise à jour
      console.log(`[Cloudflare] Mise à jour DNS record: ${record.type} ${record.name}`);
      const updated = await cloudflareRequest<CloudflareDNSRecord>(
        `/zones/${zoneId}/dns_records/${existing.id}`,
        'PUT',
        {
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl || 1, // 1 = automatic
          proxied: record.proxied ?? false,
          priority: record.priority,
        }
      );
      return updated;
    } else {
      // Création
      console.log(`[Cloudflare] Création DNS record: ${record.type} ${record.name}`);
      const created = await cloudflareRequest<CloudflareDNSRecord>(
        `/zones/${zoneId}/dns_records`,
        'POST',
        {
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl || 1,
          proxied: record.proxied ?? false,
          priority: record.priority,
        }
      );
      return created;
    }
  } catch (error) {
    // Si erreur 81053 (record exists), c'est qu'on n'a pas réussi à le trouver mais il existe
    // Dans ce cas, on peut considérer que c'est OK (idempotence)
    if (error instanceof Error && error.message.includes('81053')) {
      console.log(`[Cloudflare] Record ${record.type} ${record.name} existe déjà, considéré comme OK (idempotent)`);
      // Retourner un objet factice pour continuer
      return {
        type: record.type,
        name: record.name,
        content: record.content,
        proxied: record.proxied,
      } as CloudflareDNSRecord;
    }
    
    console.error('[Cloudflare] upsertDNSRecord error:', error);
    throw error;
  }
}

/**
 * Crée les DNS records nécessaires pour Vercel
 * Utilise CNAME flattening de Cloudflare pour @ et www
 */
export async function createVercelDNSRecords(
  zoneId: string,
  domain: string
): Promise<void> {
  try {
    // CNAME pour apex (@) - Cloudflare supporte CNAME flattening
    await upsertDNSRecord(zoneId, {
      type: 'CNAME',
      name: '@',
      content: 'cname.vercel-dns.com',
      proxied: false, // Important: ne pas proxifier pour Vercel
      ttl: 1, // automatic
    });

    // CNAME pour www
    await upsertDNSRecord(zoneId, {
      type: 'CNAME',
      name: 'www',
      content: 'cname.vercel-dns.com',
      proxied: false,
      ttl: 1,
    });

    console.log(`[Cloudflare] DNS records Vercel créés pour ${domain}`);
  } catch (error) {
    console.error('[Cloudflare] createVercelDNSRecords error:', error);
    throw error;
  }
}
