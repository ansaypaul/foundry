import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';
import { computeSiteDecisionProfile } from '@/lib/core/decisionEngine/siteDecisionEngine';
import { getSeoBootstrapStats } from '@/lib/services/setup/seoBootstrap';
import { BlueprintV1, BlueprintV1Schema } from './types';

/**
 * Build a complete snapshot of the site's current state
 */
export async function buildSiteBlueprint(siteId: string): Promise<BlueprintV1> {
  const supabase = getSupabaseAdmin();
  
  // 1. Load site
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error('Site not found');
  }

  // 2. Compute decision profile
  const profile = computeSiteDecisionProfile({
    siteType: site.site_type,
    automationLevel: site.automation_level,
    ambitionLevel: site.ambition_level,
    description: site.description,
    language: site.language,
    country: site.country,
  });

  // 3. Load authors
  const { data: authorsData } = await supabase
    .from('authors')
    .select('role_key, display_name, specialties, is_ai, status')
    .eq('site_id', siteId)
    .order('role_key');

  const authors = (authorsData || []).map(a => ({
    roleKey: a.role_key || 'unknown',
    displayName: a.display_name,
    specialties: Array.isArray(a.specialties) ? a.specialties : [],
    isAi: a.is_ai ?? false,
    status: a.status || 'active',
  }));

  // 4. Load categories (taxonomy)
  const { data: categoriesData } = await supabase
    .from('terms')
    .select('name, slug, parent_id, order, status')
    .eq('site_id', siteId)
    .eq('type', 'category')
    .order('order')
    .order('slug');

  const categories = (categoriesData || []).map(c => ({
    name: c.name,
    slug: c.slug,
    parentSlug: null, // v1: no parent resolution
    order: c.order || 0,
    status: c.status || 'active',
  }));

  // 5. Load mandatory pages
  const { data: pagesData } = await supabase
    .from('content')
    .select('page_type, title, slug, status')
    .eq('site_id', siteId)
    .eq('type', 'page')
    .not('page_type', 'is', null)
    .order('page_type');

  const pages = (pagesData || []).map(p => ({
    type: p.page_type || 'unknown',
    title: p.title,
    slug: p.slug,
    status: p.status || 'draft',
  }));

  // 6. Load SEO defaults and bootstrap stats
  const { data: siteSeoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'site')
    .eq('entity_id', siteId)
    .maybeSingle();

  const seoBootstrapStats = await getSeoBootstrapStats(siteId);

  const seoDefaults = {
    contentTitleTemplate: siteSeoMeta?.seo_title || '{{title}} | {{siteName}}',
    termTitleTemplate: '{{name}} | {{siteName}}',
    descriptionStrategy: siteSeoMeta?.seo_description || 'excerpt_or_first_paragraph_155',
    defaultOgImage: siteSeoMeta?.seo_og_image || null,
    defaultOgType: siteSeoMeta?.seo_og_type || 'article',
    robotsDefault: {
      index: siteSeoMeta?.seo_robots_index ?? true,
      follow: siteSeoMeta?.seo_robots_follow ?? true,
    },
  };

  const seoBootstrap = {
    applied: seoBootstrapStats.siteSeoExists,
    stats: {
      contentSeoCount: seoBootstrapStats.contentSeoCount,
      termSeoCount: seoBootstrapStats.termSeoCount,
      siteSeoExists: seoBootstrapStats.siteSeoExists,
    },
  };

  // 8. Assemble blueprint
  const blueprint: BlueprintV1 = {
    version: 1,
    generatedAt: new Date().toISOString(),
    
    site: {
      id: site.id,
      name: site.name,
      language: site.language,
      country: site.country,
      siteType: site.site_type,
      automationLevel: site.automation_level,
      ambitionLevel: site.ambition_level,
      description: site.description,
    },
    
    decisionProfile: {
      siteSize: profile.siteSize,
      complexity: profile.complexity,
      velocity: profile.velocity,
      targets: profile.targets,
    },
    
    authors,
    
    taxonomy: {
      categories,
    },
    
    pages,
    
    seoDefaults,
    
    seoBootstrap,
  };

  // 9. Validate with Zod
  const validated = BlueprintV1Schema.parse(blueprint);
  
  return validated;
}

/**
 * Save blueprint to database
 */
export async function saveSiteBlueprint(
  siteId: string,
  blueprint: BlueprintV1,
  notes?: string
): Promise<{ id: string; version: number }> {
  const supabase = getSupabaseAdmin();

  // Get next version number
  const { data: latestBlueprint } = await supabase
    .from('site_blueprint')
    .select('version')
    .eq('site_id', siteId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = latestBlueprint ? latestBlueprint.version + 1 : 1;

  // Insert new blueprint
  const { data, error } = await supabase
    .from('site_blueprint')
    .insert({
      site_id: siteId,
      version: nextVersion,
      blueprint_json: blueprint,
      notes: notes || null,
    })
    .select('id, version')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    version: data.version,
  };
}

/**
 * Get blueprint by version
 */
export async function getBlueprintByVersion(
  siteId: string,
  version: number
): Promise<BlueprintV1 | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('site_blueprint')
    .select('blueprint_json')
    .eq('site_id', siteId)
    .eq('version', version)
    .single();

  if (error || !data) {
    return null;
  }

  return data.blueprint_json as BlueprintV1;
}

/**
 * List all blueprints for a site
 */
export async function listSiteBlueprints(siteId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('site_blueprint')
    .select('id, version, notes, created_at')
    .eq('site_id', siteId)
    .order('version', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
