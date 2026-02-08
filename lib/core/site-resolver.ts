import { getDomainByHostname, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { Site, Domain } from '@/lib/db/types';

// Simple in-memory cache for domain resolution
const domainCache = new Map<string, { site: Site; domain: Domain; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Normalize hostname for consistent lookup
 */
export function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/:\d+$/, '') // Remove port
    .replace(/^www\./, '') // Remove www
    .replace(/\.$/, ''); // Remove trailing dot
}

/**
 * Resolve site from hostname
 */
export async function resolveSiteFromHostname(hostname: string): Promise<{ site: Site; domain: Domain } | null> {
  const normalized = normalizeHostname(hostname);
  
  // Check cache first
  const cached = domainCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { site: cached.site, domain: cached.domain };
  }

  // Query database using Supabase
  const result = await getDomainByHostname(normalized);

  if (!result || !result.site) {
    return null;
  }

  const domain: Domain = {
    id: result.id,
    site_id: result.site_id,
    hostname: result.hostname,
    is_primary: result.is_primary,
    redirect_to_primary: result.redirect_to_primary,
    created_at: new Date(result.created_at),
    updated_at: new Date(result.updated_at),
  };

  const site: Site = {
    ...result.site,
    created_at: new Date(result.site.created_at),
    updated_at: new Date(result.site.updated_at),
  };

  // Cache the result
  domainCache.set(normalized, { site, domain, timestamp: Date.now() });

  return { site, domain };
}

/**
 * Get primary domain for a site
 */
export async function getPrimaryDomain(siteId: string): Promise<Domain | null> {
  return getPrimaryDomainBySiteId(siteId);
}

/**
 * Clear domain cache (useful after domain updates)
 */
export function clearDomainCache(): void {
  domainCache.clear();
}
