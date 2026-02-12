import { getSupabaseAdmin } from '@/lib/db/client';

// ===================================
// TYPES
// ===================================

export interface SeoBootstrapPlan {
  siteSeo: SiteSeoDefaults | null;
  contentSeo: ContentSeoBootstrap[];
  termSeo: TermSeoBootstrap[];
}

export interface SiteSeoDefaults {
  seoTitleTemplate: string;
  descriptionStrategy: string;
  defaultOgImage: string | null;
  defaultOgType: string;
  robotsDefault: {
    index: boolean;
    follow: boolean;
  };
}

export interface ContentSeoBootstrap {
  entityId: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  ogType: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface TermSeoBootstrap {
  entityId: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  ogType: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface SeoBootstrapStats {
  siteSeoExists: boolean;
  contentSeoCount: number;
  termSeoCount: number;
  contentMissingCount: number;
  termMissingCount: number;
}

// ===================================
// BUILD SEO BOOTSTRAP PLAN
// ===================================

/**
 * Build SEO bootstrap plan for a site
 * Returns all SEO metadata that should be created for site defaults, pages, and categories
 */
export async function buildSeoBootstrapPlan(siteId: string): Promise<SeoBootstrapPlan> {
  const supabase = getSupabaseAdmin();

  // Load site info
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, description')
    .eq('id', siteId)
    .single();

  if (!site) {
    throw new Error('Site not found');
  }

  // Check if site defaults already exist
  const { data: existingSiteSeo } = await supabase
    .from('seo_meta')
    .select('id')
    .eq('entity_type', 'site')
    .eq('entity_id', siteId)
    .maybeSingle();

  // Site defaults (only if missing)
  const siteSeo: SiteSeoDefaults | null = existingSiteSeo
    ? null
    : {
        seoTitleTemplate: '{{title}} | {{siteName}}',
        descriptionStrategy: 'excerpt_or_first_paragraph_155',
        defaultOgImage: null,
        defaultOgType: 'article',
        robotsDefault: {
          index: true,
          follow: true,
        },
      };

  // Load all pages (type='page')
  const { data: pages } = await supabase
    .from('content')
    .select('id, title, page_type')
    .eq('site_id', siteId)
    .eq('type', 'page');

  // Load existing SEO for pages
  const pageIds = pages?.map((p) => p.id) || [];
  const { data: existingPageSeo } = await supabase
    .from('seo_meta')
    .select('entity_id')
    .eq('entity_type', 'content')
    .in('entity_id', pageIds);

  const existingPageSeoIds = new Set(existingPageSeo?.map((s) => s.entity_id) || []);

  // Build SEO for pages that don't have it
  const contentSeo: ContentSeoBootstrap[] = (pages || [])
    .filter((page) => !existingPageSeoIds.has(page.id))
    .map((page) => ({
      entityId: page.id,
      title: page.title,
      seoTitle: `${page.title} | ${site.name}`,
      seoDescription: buildPageDescription(page.title, site.name, page.page_type),
      ogTitle: `${page.title} | ${site.name}`,
      ogDescription: buildPageDescription(page.title, site.name, page.page_type),
      ogImage: null,
      ogType: 'website',
      robotsIndex: true,
      robotsFollow: true,
    }));

  // Load all categories
  const { data: categories } = await supabase
    .from('terms')
    .select('id, name, slug, type')
    .eq('site_id', siteId)
    .eq('type', 'category');

  // Load existing SEO for categories
  const categoryIds = categories?.map((c) => c.id) || [];
  const { data: existingCategorySeo } = await supabase
    .from('seo_meta')
    .select('entity_id')
    .eq('entity_type', 'term')
    .in('entity_id', categoryIds);

  const existingCategorySeoIds = new Set(existingCategorySeo?.map((s) => s.entity_id) || []);

  // Build SEO for categories that don't have it
  const termSeo: TermSeoBootstrap[] = (categories || [])
    .filter((cat) => !existingCategorySeoIds.has(cat.id))
    .map((cat) => ({
      entityId: cat.id,
      name: cat.name,
      seoTitle: `${cat.name} | ${site.name}`,
      seoDescription: buildCategoryDescription(cat.name, site.name),
      ogTitle: `${cat.name} | ${site.name}`,
      ogDescription: buildCategoryDescription(cat.name, site.name),
      ogImage: null,
      ogType: 'website',
      robotsIndex: true,
      robotsFollow: true,
    }));

  return {
    siteSeo,
    contentSeo,
    termSeo,
  };
}

/**
 * Build description for a page
 */
function buildPageDescription(pageTitle: string, siteName: string, pageType: string | null): string {
  const typeMap: Record<string, string> = {
    about: `Découvrez qui nous sommes et notre mission sur ${siteName}.`,
    contact: `Contactez l'équipe de ${siteName} pour toute question ou demande.`,
    legal: `Mentions légales et informations juridiques de ${siteName}.`,
    privacy: `Politique de confidentialité et protection des données sur ${siteName}.`,
    terms: `Conditions générales d'utilisation de ${siteName}.`,
  };

  if (pageType && typeMap[pageType]) {
    return typeMap[pageType];
  }

  // Generic fallback
  return `${pageTitle} - Toutes les informations sur ${siteName}.`;
}

/**
 * Build description for a category
 */
function buildCategoryDescription(categoryName: string, siteName: string): string {
  return `Tous nos articles sur ${categoryName} : actualités, analyses, dossiers et sélections par la rédaction de ${siteName}.`;
}

// ===================================
// APPLY SEO BOOTSTRAP PLAN
// ===================================

/**
 * Apply SEO bootstrap plan to database
 * Creates seo_meta rows for site, pages, and categories
 * Idempotent: will not overwrite existing SEO metadata
 */
export async function applySeoBootstrapPlan(siteId: string, plan: SeoBootstrapPlan): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Create site defaults if needed
  if (plan.siteSeo) {
    await supabase.from('seo_meta').insert({
      entity_type: 'site',
      entity_id: siteId,
      seo_title: plan.siteSeo.seoTitleTemplate,
      seo_description: plan.siteSeo.descriptionStrategy,
      seo_og_image: plan.siteSeo.defaultOgImage,
      seo_og_type: plan.siteSeo.defaultOgType,
      seo_robots_index: plan.siteSeo.robotsDefault.index,
      seo_robots_follow: plan.siteSeo.robotsDefault.follow,
    });
  }

  // 2. Create SEO for pages
  if (plan.contentSeo.length > 0) {
    const contentSeoRows = plan.contentSeo.map((content) => ({
      entity_type: 'content',
      entity_id: content.entityId,
      seo_title: content.seoTitle,
      seo_description: content.seoDescription,
      seo_og_title: content.ogTitle,
      seo_og_description: content.ogDescription,
      seo_og_image: content.ogImage,
      seo_og_type: content.ogType,
      seo_robots_index: content.robotsIndex,
      seo_robots_follow: content.robotsFollow,
    }));

    await supabase.from('seo_meta').insert(contentSeoRows);
  }

  // 3. Create SEO for categories
  if (plan.termSeo.length > 0) {
    const termSeoRows = plan.termSeo.map((term) => ({
      entity_type: 'term',
      entity_id: term.entityId,
      seo_title: term.seoTitle,
      seo_description: term.seoDescription,
      seo_og_title: term.ogTitle,
      seo_og_description: term.ogDescription,
      seo_og_image: term.ogImage,
      seo_og_type: term.ogType,
      seo_robots_index: term.robotsIndex,
      seo_robots_follow: term.robotsFollow,
    }));

    await supabase.from('seo_meta').insert(termSeoRows);
  }
}

// ===================================
// GET SEO BOOTSTRAP STATS
// ===================================

/**
 * Get current SEO bootstrap statistics for a site
 * Shows how many pages/categories have SEO, how many are missing
 */
export async function getSeoBootstrapStats(siteId: string): Promise<SeoBootstrapStats> {
  const supabase = getSupabaseAdmin();

  // Check site SEO exists
  const { data: siteSeo } = await supabase
    .from('seo_meta')
    .select('id')
    .eq('entity_type', 'site')
    .eq('entity_id', siteId)
    .maybeSingle();

  // Count pages
  const { count: totalPagesCount } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('type', 'page');

  // Count pages with SEO
  const { data: pageIds } = await supabase
    .from('content')
    .select('id')
    .eq('site_id', siteId)
    .eq('type', 'page');

  const pageIdsList = pageIds?.map((p) => p.id) || [];
  
  const { count: contentSeoCount } = await supabase
    .from('seo_meta')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'content')
    .in('entity_id', pageIdsList);

  // Count categories
  const { count: totalCategoriesCount } = await supabase
    .from('terms')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('type', 'category');

  // Count categories with SEO
  const { data: categoryIds } = await supabase
    .from('terms')
    .select('id')
    .eq('site_id', siteId)
    .eq('type', 'category');

  const categoryIdsList = categoryIds?.map((c) => c.id) || [];
  
  const { count: termSeoCount } = await supabase
    .from('seo_meta')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'term')
    .in('entity_id', categoryIdsList);

  return {
    siteSeoExists: !!siteSeo,
    contentSeoCount: contentSeoCount || 0,
    termSeoCount: termSeoCount || 0,
    contentMissingCount: (totalPagesCount || 0) - (contentSeoCount || 0),
    termMissingCount: (totalCategoriesCount || 0) - (termSeoCount || 0),
  };
}
