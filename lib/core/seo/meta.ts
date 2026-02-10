/**
 * SEO Core - Meta Tags Generator
 * Génération des balises meta pour Next.js Metadata API
 */

import type { Metadata } from 'next';
import type { ResolvedSeoMeta } from './config';
import { buildRobotsMeta } from './utils';

// ===================================
// NEXT.JS METADATA GENERATION
// ===================================

/**
 * Génère l'objet Metadata pour Next.js à partir des SEO résolues
 * Compatible avec Next.js 13+ App Router
 */
export function generateMetadata(seo: ResolvedSeoMeta): Metadata {
  const metadata: Metadata = {
    // Basic meta
    title: seo.title,
    description: seo.description,

    // Robots avec directives modernes
    robots: {
      index: seo.robots.index,
      follow: seo.robots.follow,
      'max-snippet': seo.robots.maxSnippet ?? -1,
      'max-image-preview': seo.robots.maxImagePreview ?? 'large',
      'max-video-preview': seo.robots.maxVideoPreview ?? -1,
    } as any,

    // Open Graph
    openGraph: {
      title: seo.og.title,
      description: seo.og.description,
      url: seo.og.url,
      type: seo.og.type as any,
      images: seo.og.image
        ? [
            {
              url: seo.og.image,
              width: 1200,
              height: 630,
              alt: seo.og.title,
            },
          ]
        : undefined,
    },

    // Twitter
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image] : undefined,
    },

    // Canonical
    alternates: {
      canonical: seo.canonical,
    },
  };

  return metadata;
}

// ===================================
// MANUAL HTML TAGS (if needed)
// ===================================

/**
 * Génère les balises HTML manuellement (pour compatibilité legacy)
 * Utile si on n'utilise pas Next.js Metadata API
 */
export function generateMetaTags(seo: ResolvedSeoMeta): string[] {
  const tags: string[] = [];

  // Title (handled by <title> tag separately)
  // tags.push(`<title>${escapeHtml(seo.title)}</title>`);

  // Basic meta
  tags.push(`<meta name="description" content="${escapeHtml(seo.description)}" />`);
  tags.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`);
  tags.push(`<meta name="robots" content="${buildRobotsMeta(seo.robots.index, seo.robots.follow, {
    maxSnippet: seo.robots.maxSnippet,
    maxImagePreview: seo.robots.maxImagePreview,
    maxVideoPreview: seo.robots.maxVideoPreview,
  })}" />`);

  // Open Graph
  tags.push(`<meta property="og:title" content="${escapeHtml(seo.og.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(seo.og.description)}" />`);
  tags.push(`<meta property="og:url" content="${escapeHtml(seo.og.url)}" />`);
  tags.push(`<meta property="og:type" content="${escapeHtml(seo.og.type)}" />`);
  
  if (seo.og.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(seo.og.image)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
  }

  // Twitter
  tags.push(`<meta name="twitter:card" content="${seo.twitter.card}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(seo.twitter.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(seo.twitter.description)}" />`);
  
  if (seo.twitter.image) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(seo.twitter.image)}" />`);
  }

  return tags;
}

/**
 * Génère les scripts JSON-LD pour Schema.org
 */
export function generateSchemaScripts(seo: ResolvedSeoMeta): string[] {
  return seo.schema.map((schema) => {
    const json = JSON.stringify(schema, null, 0); // Compact JSON
    return `<script type="application/ld+json">${json}</script>`;
  });
}

/**
 * Génère toutes les balises SEO (meta + schema)
 */
export function generateAllSeoTags(seo: ResolvedSeoMeta): string {
  const metaTags = generateMetaTags(seo);
  const schemaTags = generateSchemaScripts(seo);
  
  return [...metaTags, ...schemaTags].join('\n');
}

// ===================================
// UTILITIES
// ===================================

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

// ===================================
// REACT COMPONENTS (Optional)
// ===================================

/**
 * Génère les props pour next/head (Pages Router)
 */
export interface HeadProps {
  title: string;
  meta: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
  link: Array<{
    rel: string;
    href: string;
  }>;
  script: Array<{
    type: string;
    dangerouslySetInnerHTML: {
      __html: string;
    };
  }>;
}

/**
 * Convertit ResolvedSeoMeta en props pour <Head> (Pages Router)
 */
export function toHeadProps(seo: ResolvedSeoMeta): HeadProps {
  const meta: HeadProps['meta'] = [];
  const link: HeadProps['link'] = [];
  const script: HeadProps['script'] = [];

  // Basic meta
  meta.push({ name: 'description', content: seo.description });
  meta.push({ name: 'robots', content: buildRobotsMeta(seo.robots.index, seo.robots.follow, {
    maxSnippet: seo.robots.maxSnippet,
    maxImagePreview: seo.robots.maxImagePreview,
    maxVideoPreview: seo.robots.maxVideoPreview,
  }) });

  // Canonical
  link.push({ rel: 'canonical', href: seo.canonical });

  // Open Graph
  meta.push({ property: 'og:title', content: seo.og.title });
  meta.push({ property: 'og:description', content: seo.og.description });
  meta.push({ property: 'og:url', content: seo.og.url });
  meta.push({ property: 'og:type', content: seo.og.type });
  
  if (seo.og.image) {
    meta.push({ property: 'og:image', content: seo.og.image });
    meta.push({ property: 'og:image:width', content: '1200' });
    meta.push({ property: 'og:image:height', content: '630' });
  }

  // Twitter
  meta.push({ name: 'twitter:card', content: seo.twitter.card });
  meta.push({ name: 'twitter:title', content: seo.twitter.title });
  meta.push({ name: 'twitter:description', content: seo.twitter.description });
  
  if (seo.twitter.image) {
    meta.push({ name: 'twitter:image', content: seo.twitter.image });
  }

  // Schema.org scripts
  seo.schema.forEach((schema) => {
    script.push({
      type: 'application/ld+json',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(schema),
      },
    });
  });

  return {
    title: seo.title,
    meta,
    link,
    script,
  };
}
