import { Site, Domain } from '@/lib/db/types';
import { headers } from 'next/headers';
import { resolveSiteFromHostname, resolveSiteFromPreview } from '@/lib/core/site-resolver';

export interface SiteContext {
  site: Site;
  domain: Domain | null;
  isPreview?: boolean;
}

/**
 * Get current site from request headers (Server Component)
 */
export async function getCurrentSite(): Promise<SiteContext | null> {
  const headersList = await headers();
  
  // Vérifier si on est en mode preview
  const previewSiteId = headersList.get('x-foundry-preview-site-id');
  const isPreview = headersList.get('x-foundry-is-preview') === 'true';
  
  if (isPreview && previewSiteId) {
    const result = await resolveSiteFromPreview(previewSiteId);
    
    if (!result) {
      return null;
    }
    
    return {
      site: result.site,
      domain: null,
      isPreview: true,
    };
  }
  
  // Mode normal avec hostname
  const hostname = headersList.get('x-foundry-hostname') || headersList.get('host') || 'localhost';
  const result = await resolveSiteFromHostname(hostname);
  
  if (!result) {
    return null;
  }

  return {
    site: result.site,
    domain: result.domain,
    isPreview: false,
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
