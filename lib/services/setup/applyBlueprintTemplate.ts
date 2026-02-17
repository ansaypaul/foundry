import { getSupabaseAdmin } from '@/lib/db/client';
import { BlueprintTemplateV1 } from '@/lib/services/blueprint/blueprintTemplateSchema';

// ====================================
// Content Type Initialization
// ====================================

/**
 * Get default content type keys based on site type
 */
function getDefaultContentTypeKeys(siteType: string): string[] {
  switch (siteType) {
    case 'news_media':
      return ['news', 'explainer', 'interview', 'opinion'];
    case 'gaming_popculture':
      return ['news', 'review', 'guide', 'top10'];
    case 'affiliate_guides':
      return ['guide', 'review', 'comparison', 'top10', 'howto'];
    case 'lifestyle':
      return ['guide', 'top10', 'howto', 'opinion'];
    case 'niche_passion':
    default:
      return ['news', 'guide', 'review', 'top10', 'howto'];
  }
}

/**
 * Initialize site_content_type_settings for a new site
 * Activates default content types based on site type
 */
async function initializeSiteContentTypes(
  siteId: string,
  siteType: string
): Promise<{ initialized: number; skipped: number }> {
  const supabase = getSupabaseAdmin();
  
  // Get default content type keys for this site type
  const defaultKeys = getDefaultContentTypeKeys(siteType);
  
  // Get editorial content types from registry
  const { data: contentTypes, error } = await supabase
    .from('editorial_content_types')
    .select('id, key')
    .in('key', defaultKeys)
    .eq('is_active', true);
  
  if (error || !contentTypes) {
    console.warn('Failed to load editorial content types:', error);
    return { initialized: 0, skipped: 0 };
  }
  
  let initialized = 0;
  let skipped = 0;
  
  // Create site_content_type_settings for each default type
  for (const contentType of contentTypes) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('site_content_type_settings')
      .select('id')
      .eq('site_id', siteId)
      .eq('content_type_id', contentType.id)
      .maybeSingle();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Create setting (enabled by default)
    const { error: insertError } = await supabase
      .from('site_content_type_settings')
      .insert({
        site_id: siteId,
        content_type_id: contentType.id,
        is_enabled: true,
      });
    
    if (!insertError) {
      initialized++;
    }
  }
  
  return { initialized, skipped };
}

// ====================================
// Apply Blueprint Template to Database
// ====================================

export interface ApplyBlueprintResult {
  created: {
    categories: number;
    authors: number;
    pages: number;
    seoMeta: number;
    contentTypeSettings: number; // NEW: site_content_type_settings initialized
  };
  skipped: {
    categories: number;
    authors: number;
    pages: number;
  };
}

/**
 * Apply a blueprint template from site_blueprint table
 * Idempotent: skips existing items by slug
 * 
 * @param siteId - Site ID
 * @param version - Specific blueprint version to apply (optional, defaults to active version)
 */
export async function applyBlueprintTemplate(
  siteId: string,
  version?: number
): Promise<ApplyBlueprintResult> {
  const supabase = getSupabaseAdmin();

  // 1. Load blueprint from site_blueprint table
  let blueprintQuery = supabase
    .from('site_blueprint')
    .select('*')
    .eq('site_id', siteId);

  if (version !== undefined) {
    // Apply specific version
    blueprintQuery = blueprintQuery.eq('version', version);
  } else {
    // Apply active version (or latest if no active set)
    const { data: siteData } = await supabase
      .from('sites')
      .select('active_blueprint_version')
      .eq('id', siteId)
      .single();

    if (siteData?.active_blueprint_version) {
      blueprintQuery = blueprintQuery.eq('version', siteData.active_blueprint_version);
    } else {
      // Fallback to latest version
      blueprintQuery = blueprintQuery.order('version', { ascending: false }).limit(1);
    }
  }

  const { data: blueprintRecord, error: blueprintError } = await blueprintQuery.single();

  if (blueprintError || !blueprintRecord) {
    throw new Error(`Blueprint not found for site ${siteId}: ${blueprintError?.message || 'No blueprint exists'}`);
  }

  const template = blueprintRecord.blueprint_json as BlueprintTemplateV1;

  const result: ApplyBlueprintResult = {
    created: { categories: 0, authors: 0, pages: 0, seoMeta: 0, contentTypeSettings: 0 },
    skipped: { categories: 0, authors: 0, pages: 0 },
  };

  // 1. Create Categories (terms)
  for (const category of template.taxonomy.categories) {
    // Check if exists
    const { data: existing } = await supabase
      .from('terms')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', category.slug)
      .eq('type', 'category')
      .maybeSingle();

    if (existing) {
      result.skipped.categories++;
      continue;
    }

    // Create term
    const { data: newTerm, error } = await supabase
      .from('terms')
      .insert({
        site_id: siteId,
        name: category.name,
        slug: category.slug,
        type: 'category',
        description: null, // Will be enriched later
        status: 'active',
      })
      .select()
      .single();

    if (!error && newTerm) {
      result.created.categories++;

      // Create minimal SEO meta
      await supabase.from('seo_meta').insert({
        entity_type: 'term',
        entity_id: newTerm.id,
        seo_title: null, // Will use template
        seo_description: null, // Will be enriched
        seo_robots_index: true,
        seo_robots_follow: true,
      });
      result.created.seoMeta++;
    }
  }

  // 2. Create Authors
  for (const author of template.authors) {
    // Generate slug from displayName
    const authorSlug = author.displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if exists
    const { data: existing } = await supabase
      .from('authors')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', authorSlug)
      .maybeSingle();

    if (existing) {
      result.skipped.authors++;
      continue;
    }

    // Create author
    const { error } = await supabase.from('authors').insert({
      site_id: siteId,
      display_name: author.displayName,
      slug: authorSlug,
      bio: null, // Will be enriched later
      role_key: author.roleKey,
      specialties: author.specialties,
      is_ai: author.isAi,
      status: 'active',
    });

    if (!error) {
      result.created.authors++;
    }
  }

  // 3. Create Pages
  const pageKeyToSlug: Record<string, string> = {
    about: 'a-propos',
    contact: 'contact',
    legal: 'mentions-legales',
    privacy: 'politique-de-confidentialite',
    terms: 'conditions-generales-utilisation',
  };

  for (const page of template.pages) {
    const pageSlug = pageKeyToSlug[page.key] || page.slug;

    // Check if exists
    const { data: existing } = await supabase
      .from('content')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', pageSlug)
      .eq('type', 'page')
      .maybeSingle();

    if (existing) {
      result.skipped.pages++;
      continue;
    }

    // Create page
    const { data: newPage, error } = await supabase
      .from('content')
      .insert({
        site_id: siteId,
        title: page.title,
        slug: pageSlug,
        type: 'page',
        page_type: page.key,
        status: 'draft',
        content_html: null, // Will be enriched later
        author_id: null, // Pages don't need authors
      })
      .select()
      .single();

    if (!error && newPage) {
      result.created.pages++;

      // Create minimal SEO meta
      await supabase.from('seo_meta').insert({
        entity_type: 'content',
        entity_id: newPage.id,
        seo_title: null,
        seo_description: null,
        seo_robots_index: true,
        seo_robots_follow: true,
      });
      result.created.seoMeta++;
    }
  }

  // 4. Initialize Content Type Settings (from editorial_content_types registry)
  const contentTypesInitResult = await initializeSiteContentTypes(siteId, template.site.siteType);
  result.created.contentTypeSettings = contentTypesInitResult.initialized;

  // 5. Create/update site-level SEO defaults
  const { data: siteSeoMeta } = await supabase
    .from('seo_meta')
    .select('id')
    .eq('entity_type', 'site')
    .eq('entity_id', siteId)
    .maybeSingle();

  if (!siteSeoMeta) {
    await supabase.from('seo_meta').insert({
      entity_type: 'site',
      entity_id: siteId,
      seo_og_type: template.seoDefaults.ogTypeDefault,
      seo_robots_index: template.seoDefaults.robotsDefault.index,
      seo_robots_follow: template.seoDefaults.robotsDefault.follow,
    });
    result.created.seoMeta++;
  }

  // 6. Update site setup_status to 'blueprint_applied'
  await supabase
    .from('sites')
    .update({ setup_status: 'blueprint_applied' })
    .eq('id', siteId);

  return result;
}
