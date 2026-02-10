import { cache } from 'react';
import { 
  getSiteById, 
  getTermBySlug, 
  getPrimaryDomainBySiteId 
} from '@/lib/db/queries';
import { 
  getContentBySlugWithSeo,
  getTermWithSeo 
} from '@/lib/db/seo-queries';
import { getSeoSettings } from '@/lib/core/seo';

// Wrapper tout avec cache()
export const getCachedSite = cache(getSiteById);
export const getCachedTerm = cache(getTermBySlug);
export const getCachedContent = cache(getContentBySlugWithSeo);
export const getCachedTermWithSeo = cache(getTermWithSeo);
export const getCachedSeoSettings = cache(getSeoSettings);
export const getCachedDomain = cache(getPrimaryDomainBySiteId);

// Fonction helper qui parallélise tout
export const getPageData = cache(async (siteId: string, slug: string) => {
  // Paralléliser les queries de base
  const [site, categoryBasic, settings, domain] = await Promise.all([
    getCachedSite(siteId),
    getCachedTerm(siteId, slug, 'category'),
    getCachedSeoSettings(siteId),
    getCachedDomain(siteId),
  ]);
  
  if (!site) return null;
  
  // Si catégorie trouvée
  if (categoryBasic) {
    const category = await getCachedTermWithSeo(categoryBasic.id) || categoryBasic;
    return { 
      type: 'category' as const, 
      site, 
      category, 
      settings, 
      domain 
    };
  }
  
  // Sinon chercher post ou page (en parallèle)
  const [postContent, pageContent] = await Promise.all([
    getCachedContent(site.id, slug, 'post'),
    getCachedContent(site.id, slug, 'page'),
  ]);
  
  const content = postContent || pageContent;
  
  if (!content) return null;
  
  return { 
    type: 'content' as const, 
    site, 
    content, 
    settings, 
    domain 
  };
});
