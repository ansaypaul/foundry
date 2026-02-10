/**
 * SEO Core - Configuration & Types
 * Configuration globale du système SEO de Foundry
 */

import type { Content, Term, SeoSettings } from '@/lib/db/types';

// ===================================
// TYPES & INTERFACES
// ===================================

/**
 * Métadonnées SEO résolues (après fallbacks)
 */
export interface ResolvedSeoMeta {
  // Basic meta
  title: string;
  description: string;
  canonical: string;
  robots: {
    index: boolean;
    follow: boolean;
    maxSnippet?: number;
    maxImagePreview?: 'none' | 'standard' | 'large';
    maxVideoPreview?: number;
  };

  // Open Graph
  og: {
    title: string;
    description: string;
    image: string | null;
    type: string;
    url: string;
  };

  // Twitter
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image: string | null;
  };

  // Schema.org (JSON-LD)
  schema: SchemaGraph[];

  // Breadcrumbs
  breadcrumbs?: Breadcrumb[];

  // SEO Analysis
  score?: number;
  focusKeyword?: string;
}

/**
 * Schema.org graph types
 */
export type SchemaGraph = 
  | SchemaWebSite
  | SchemaWebPage
  | SchemaArticle
  | SchemaBreadcrumbList
  | SchemaOrganization;

export interface SchemaWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: string;
  };
}

export interface SchemaWebPage {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  url: string;
  description?: string;
  breadcrumb?: {
    '@type': 'BreadcrumbList';
    itemListElement: any[];
  };
}

export interface SchemaArticle {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': 'Person';
    name: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
}

export interface SchemaBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbSchemaItem[];
}

export interface BreadcrumbSchemaItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface SchemaOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
}

/**
 * Breadcrumb item
 */
export interface Breadcrumb {
  label: string;
  url?: string;
}

/**
 * Context pour la résolution SEO
 */
export interface SeoContext {
  // Entity
  entity: Content | Term | null;
  entityType: 'content' | 'term' | 'home' | 'archive';

  // Site info
  siteUrl: string;
  siteName: string;
  siteTagline?: string;

  // Settings
  settings: SeoSettings | null;

  // Current URL
  currentPath: string;

  // Optional relationships
  category?: Term;
  author?: {
    name: string;
  };
}

// ===================================
// CONSTANTS
// ===================================

/**
 * Limites recommandées SEO
 */
export const SEO_LIMITS = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  TITLE_IDEAL: 55,
  
  DESCRIPTION_MIN: 120,
  DESCRIPTION_MAX: 160,
  DESCRIPTION_IDEAL: 155,
  
  FOCUS_KEYWORD_MIN_DENSITY: 0.5, // %
  FOCUS_KEYWORD_MAX_DENSITY: 2.5, // %
  
  OG_IMAGE_MIN_WIDTH: 1200,
  OG_IMAGE_MIN_HEIGHT: 630,
} as const;

/**
 * Templates de titre par défaut
 */
export const DEFAULT_TITLE_TEMPLATES = {
  post: '{{title}} | {{siteName}}',
  page: '{{title}} | {{siteName}}',
  category: '{{name}} | {{siteName}}',
  tag: '{{name}} | {{siteName}}',
  home: '{{siteName}} – {{tagline}}',
  archive: 'Archive {{year}} | {{siteName}}',
} as const;

/**
 * Séparateurs de titre disponibles
 */
export const TITLE_SEPARATORS = {
  pipe: '|',
  dash: '-',
  ndash: '–',
  mdash: '—',
  slash: '/',
  middot: '·',
} as const;

/**
 * Robots meta valeurs
 */
export const ROBOTS_VALUES = {
  index: 'index',
  noindex: 'noindex',
  follow: 'follow',
  nofollow: 'nofollow',
} as const;

/**
 * Open Graph types par défaut
 */
export const OG_TYPES = {
  website: 'website',
  article: 'article',
  profile: 'profile',
} as const;

/**
 * Twitter Card types
 */
export const TWITTER_CARD_TYPES = {
  summary: 'summary',
  summary_large_image: 'summary_large_image',
} as const;

// ===================================
// HELPER TYPES
// ===================================

/**
 * Variables de template disponibles
 */
export interface TemplateVariables {
  title?: string;
  siteName?: string;
  tagline?: string;
  name?: string;
  category?: string;
  year?: string;
  separator?: string;
}

/**
 * Options pour le resolver
 */
export interface ResolverOptions {
  includeSchema?: boolean;
  includeBreadcrumbs?: boolean;
  includeAnalysis?: boolean;
}
