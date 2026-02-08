import { Site, Domain } from '@/lib/db/types';
import { headers } from 'next/headers';
import { resolveSiteFromHostname } from '@/lib/core/site-resolver';

export interface SiteContext {
  site: Site;
  domain: Domain;
}

/**
 * Get current site from request headers (Server Component)
 */
export async function getCurrentSite(): Promise<SiteContext | null> {
  const headersList = await headers();
  const hostname = headersList.get('x-foundry-hostname') || headersList.get('host') || 'localhost';
  
  const result = await resolveSiteFromHostname(hostname);
  
  if (!result) {
    return null;
  }

  return {
    site: result.site,
    domain: result.domain,
  };
}

/**
 * Get current site or throw error (for pages that require a site)
 */
export async function requireCurrentSite(): Promise<SiteContext> {
  const context = await getCurrentSite();
  
  if (!context) {
    throw new Error('Site not found');
  }
  
  return context;
}
