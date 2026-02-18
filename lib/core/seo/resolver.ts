/**
 * SEO Core - Resolver
 * Pipeline central de résolution des métadonnées SEO
 * Gère les fallbacks intelligents selon la spec Foundry
 */

import type {
  ResolvedSeoMeta,
  SeoContext,
  ResolverOptions,
  TemplateVariables,
  Breadcrumb,
} from './config';
import {
  renderTemplate,
  truncate,
  sanitize,
  buildAbsoluteUrl,
  normalizeCanonical,
  buildRobotsMeta,
  buildContentPath,
  buildTermPath,
  isAbsoluteUrl,
} from './utils';
import { DEFAULT_TITLE_TEMPLATES, SEO_LIMITS } from './config';
import type { Content, Term } from '@/lib/db/types';

// ===================================
// MAIN RESOLVER
// ===================================

/**
 * Résout toutes les métadonnées SEO pour une entité
 * Pipeline: données entity → fallback contenu → config globale → sanitation
 */
export async function resolveSeoMeta(
  context: SeoContext,
  options: ResolverOptions = {}
): Promise<ResolvedSeoMeta> {
  const {
    includeSchema = true,
    includeBreadcrumbs = true,
    includeAnalysis = false,
  } = options;

  // 1. Resolve basic meta
  const title = resolveTitle(context);
  const description = resolveDescription(context);
  const canonical = resolveCanonical(context);
  const robots = resolveRobots(context);

  // 2. Resolve Open Graph
  const og = resolveOpenGraph(context, title, description);

  // 3. Resolve Twitter
  const twitter = resolveTwitter(context, title, description, og.image);

  // 4. Build result
  const result: ResolvedSeoMeta = {
    title,
    description,
    canonical,
    robots,
    og,
    twitter,
    schema: [],
  };

  // 5. Optional: Schema.org
  if (includeSchema) {
    result.schema = resolveSchema(context, result);
  }

  // 6. Optional: Breadcrumbs
  if (includeBreadcrumbs && context.entityType !== 'home') {
    result.breadcrumbs = resolveBreadcrumbs(context);
  }

  // 7. Optional: Analysis
  if (includeAnalysis && context.entity) {
    result.score = (context.entity as Content).seo_score || 0;
    result.focusKeyword = (context.entity as Content).seo_focus_keyword || undefined;
  }

  return result;
}

// ===================================
// TITLE RESOLUTION
// ===================================

/**
 * Résout le titre SEO avec fallbacks intelligents
 * Priorité: seo_title → title/name → template global
 */
function resolveTitle(context: SeoContext): string {
  const { entity, entityType, siteName, siteTagline, settings } = context;

  // 1. Custom SEO title
  if (entity && 'seo_title' in entity && entity.seo_title) {
    return sanitize(entity.seo_title); // Pas de troncature, Google le fera
  }

  // 2. Build from template
  let template: string;
  let variables: TemplateVariables = {
    siteName,
    tagline: siteTagline,
    separator: settings?.separator || '|',
  };

  if (entityType === 'home') {
    template = settings?.title_template_home || DEFAULT_TITLE_TEMPLATES.home;
  } else if (entityType === 'content' && entity) {
    const content = entity as Content;
    template =
      content.type === 'post'
        ? settings?.title_template_post || DEFAULT_TITLE_TEMPLATES.post
        : settings?.title_template_page || DEFAULT_TITLE_TEMPLATES.page;
    variables.title = content.title;
  } else if (entityType === 'term' && entity) {
    const term = entity as Term;
    template =
      term.type === 'category'
        ? settings?.title_template_category || DEFAULT_TITLE_TEMPLATES.category
        : settings?.title_template_tag || DEFAULT_TITLE_TEMPLATES.tag;
    variables.name = term.name;
  } else {
    // Fallback générique
    template = '{{siteName}}';
  }

  const rendered = renderTemplate(template, variables);
  return rendered; // Pas de troncature, Google le fera
}

// ===================================
// DESCRIPTION RESOLUTION
// ===================================

/**
 * Résout la meta description avec fallbacks
 * Priorité: seo_description → excerpt/description → default global
 */
function resolveDescription(context: SeoContext): string {
  const { entity, settings } = context;

  // 1. Custom SEO description
  if (entity && 'seo_description' in entity && entity.seo_description) {
    return sanitize(entity.seo_description); // Pas de troncature
  }

  // 2. Content excerpt
  if (entity && 'excerpt' in entity && entity.excerpt) {
    return sanitize(entity.excerpt); // Pas de troncature
  }

  // 3. Term description
  if (entity && 'description' in entity && entity.description) {
    return sanitize(entity.description); // Pas de troncature
  }

  // 4. Extract from content_html (first paragraph)
  if (entity && 'content_html' in entity && entity.content_html) {
    const firstParagraph = extractFirstParagraph(entity.content_html);
    if (firstParagraph) {
      return sanitize(firstParagraph); // Pas de troncature
    }
  }

  // 5. Global default
  if (settings?.site_description) {
    return sanitize(settings.site_description); // Pas de troncature
  }

  // 6. Ultimate fallback
  return `Découvrez ${context.siteName}`; // Pas de troncature
}

/**
 * Extrait le premier paragraphe d'un contenu HTML
 */
function extractFirstParagraph(html: string): string | null {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? match[1] : null;
}

// ===================================
// CANONICAL RESOLUTION
// ===================================

/**
 * Résout l'URL canonique
 * Priorité: seo_canonical → URL auto-générée
 */
function resolveCanonical(context: SeoContext): string {
  const { entity, siteUrl, currentPath } = context;

  // 1. Custom canonical
  if (entity && 'seo_canonical' in entity && entity.seo_canonical) {
    // If absolute URL, use as is
    if (isAbsoluteUrl(entity.seo_canonical)) {
      return normalizeCanonical(entity.seo_canonical);
    }
    // If relative, make absolute
    return normalizeCanonical(buildAbsoluteUrl(siteUrl, entity.seo_canonical));
  }

  // 2. Auto-generate from current path
  const canonicalUrl = buildAbsoluteUrl(siteUrl, currentPath);
  return normalizeCanonical(canonicalUrl);
}

// ===================================
// ROBOTS RESOLUTION
// ===================================

/**
 * Résout les directives robots
 * Priorité: seo_robots_* → defaults (true, true)
 */
function resolveRobots(context: SeoContext): { 
  index: boolean; 
  follow: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
} {
  const { entity } = context;

  if (entity && 'seo_robots_index' in entity) {
    return {
      index: entity.seo_robots_index ?? true,
      follow: entity.seo_robots_follow ?? true,
      maxSnippet: -1, // Pas de limite
      maxImagePreview: 'large',
      maxVideoPreview: -1, // Pas de limite
    };
  }

  // Default: index and follow avec directives modernes
  return { 
    index: true, 
    follow: true,
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  };
}

// ===================================
// OPEN GRAPH RESOLUTION
// ===================================

/**
 * Résout les métadonnées Open Graph
 */
function resolveOpenGraph(
  context: SeoContext,
  fallbackTitle: string,
  fallbackDescription: string
) {
  const { entity, siteUrl, currentPath, settings } = context;

  // Title
  let ogTitle = fallbackTitle;
  if (entity && 'seo_og_title' in entity && entity.seo_og_title) {
    ogTitle = sanitize(entity.seo_og_title);
  }

  // Description
  let ogDescription = fallbackDescription;
  if (entity && 'seo_og_description' in entity && entity.seo_og_description) {
    ogDescription = sanitize(entity.seo_og_description);
  }

  // Image
  let ogImage: string | null = null;
  if (entity && 'seo_og_image' in entity && entity.seo_og_image) {
    ogImage = entity.seo_og_image;
  } else if (settings?.default_og_image) {
    ogImage = settings.default_og_image;
  }

  // Type
  let ogType = 'website';
  if (entity && 'seo_og_type' in entity && entity.seo_og_type) {
    ogType = entity.seo_og_type;
  } else if (context.entityType === 'content') {
    ogType = 'article';
  }

  // URL
  const ogUrl = buildAbsoluteUrl(siteUrl, currentPath);

  return {
    title: ogTitle,
    description: ogDescription,
    image: ogImage,
    type: ogType,
    url: ogUrl,
  };
}

// ===================================
// TWITTER RESOLUTION
// ===================================

/**
 * Résout les métadonnées Twitter Cards
 */
function resolveTwitter(
  context: SeoContext,
  fallbackTitle: string,
  fallbackDescription: string,
  fallbackImage: string | null
) {
  const { entity, settings } = context;

  // Card type
  let card: 'summary' | 'summary_large_image' = 'summary_large_image';
  if (entity && 'seo_twitter_card' in entity) {
    card = entity.seo_twitter_card || 'summary_large_image';
  } else if (settings?.default_twitter_card) {
    card = settings.default_twitter_card;
  }

  // Title
  let twitterTitle = fallbackTitle;
  if (entity && 'seo_twitter_title' in entity && entity.seo_twitter_title) {
    twitterTitle = sanitize(entity.seo_twitter_title);
  }

  // Description
  let twitterDescription = fallbackDescription;
  if (entity && 'seo_twitter_description' in entity && entity.seo_twitter_description) {
    twitterDescription = sanitize(entity.seo_twitter_description);
  }

  // Image
  let twitterImage = fallbackImage;
  if (entity && 'seo_twitter_image' in entity && entity.seo_twitter_image) {
    twitterImage = entity.seo_twitter_image;
  }

  return {
    card,
    title: twitterTitle,
    description: twitterDescription,
    image: twitterImage,
  };
}

// ===================================
// SCHEMA.ORG RESOLUTION
// ===================================

/**
 * Résout les données Schema.org (JSON-LD)
 */
function resolveSchema(context: SeoContext, meta: ResolvedSeoMeta) {
  const schemas: any[] = [];

  // WebSite schema (si activé)
  if (context.settings?.schema_enable_website !== false) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: context.siteName,
      url: context.siteUrl,
      description: context.settings?.site_description || undefined,
    });
  }

  // Article schema for posts (type configurable)
  if (context.entityType === 'content' && context.entity) {
    const content = context.entity as Content;
    if (content.type === 'post' && content.status === 'published') {
      const articleType = context.settings?.schema_article_type || 'Article';
      
      schemas.push({
        '@context': 'https://schema.org',
        '@type': articleType,
        headline: meta.title,
        description: meta.description,
        image: meta.og.image || undefined,
        datePublished: content.published_at 
          ? new Date(content.published_at).toISOString() 
          : undefined,
        dateModified: content.updated_at 
          ? new Date(content.updated_at).toISOString() 
          : undefined,
        author: context.author
          ? {
              '@type': 'Person',
              name: context.author.display_name,
              description: context.author.bio || undefined,
              image: context.author.avatar_url || undefined,
              url: context.author.website_url || undefined,
              sameAs: [
                context.author.twitter_username ? `https://twitter.com/${context.author.twitter_username}` : null,
                context.author.facebook_url,
                context.author.linkedin_url,
                context.author.instagram_username ? `https://instagram.com/${context.author.instagram_username}` : null,
                context.author.github_username ? `https://github.com/${context.author.github_username}` : null,
              ].filter(Boolean) as string[],
            }
          : undefined,
        publisher: context.settings?.organization_name
          ? {
              '@type': 'Organization',
              name: context.settings.organization_name,
              logo: context.settings.organization_logo
                ? {
                    '@type': 'ImageObject',
                    url: context.settings.organization_logo,
                  }
                : undefined,
            }
          : undefined,
      });
    }
  }

  // Organization schema (si activé)
  if (
    context.settings?.schema_enable_organization !== false &&
    context.settings?.organization_name
  ) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: context.settings.organization_name,
      url: context.siteUrl,
      logo: context.settings.organization_logo || undefined,
    });
  }

  return schemas;
}

// ===================================
// BREADCRUMBS RESOLUTION
// ===================================

/**
 * Résout les breadcrumbs
 */
function resolveBreadcrumbs(context: SeoContext): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [{ label: 'Accueil', url: '/' }];

  if (context.entityType === 'content' && context.entity) {
    const content = context.entity as Content;

    // Add category if exists
    if (context.category) {
      breadcrumbs.push({
        label: context.category.name,
        url: buildTermPath(context.category.type, context.category.slug),
      });
    }

    // Add current page
    const breadcrumbTitle =
      (content as any).seo_breadcrumb_title || content.title;
    breadcrumbs.push({
      label: breadcrumbTitle,
      // No URL for current page
    });
  } else if (context.entityType === 'term' && context.entity) {
    const term = context.entity as Term;
    breadcrumbs.push({
      label: term.name,
    });
  }

  return breadcrumbs;
}
