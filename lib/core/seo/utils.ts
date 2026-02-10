/**
 * SEO Core - Utilities
 * Fonctions utilitaires pour le traitement SEO
 */

import { SEO_LIMITS, type TemplateVariables } from './config';

// ===================================
// TEXT PROCESSING
// ===================================

/**
 * Tronque un texte à une longueur donnée sans couper les mots
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text) return '';
  
  // Remove HTML tags
  const plainText = stripHtml(text);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find last space before maxLength
  const truncated = plainText.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
}

/**
 * Supprime les balises HTML d'un texte
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&')  // Replace &amp;
    .replace(/&lt;/g, '<')   // Replace &lt;
    .replace(/&gt;/g, '>')   // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#039;/g, "'") // Replace &#039;
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Nettoie et sanitize un texte pour usage SEO
 */
export function sanitize(text: string): string {
  if (!text) return '';
  
  return stripHtml(text)
    .replace(/\r?\n|\r/g, ' ') // Remove line breaks
    .replace(/\s+/g, ' ')       // Normalize spaces
    .trim();
}

/**
 * Capitalise la première lettre d'un texte
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ===================================
// TEMPLATE RENDERING
// ===================================

/**
 * Remplace les variables dans un template
 * Variables supportées: {{title}}, {{siteName}}, {{tagline}}, {{name}}, {{category}}, {{year}}, {{separator}}
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  if (!template) return '';
  
  let result = template;
  
  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });
  
  // Remove unreplaced variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up double spaces and trim
  return result.replace(/\s+/g, ' ').trim();
}

// ===================================
// URL HELPERS
// ===================================

/**
 * Construit une URL absolue
 */
export function buildAbsoluteUrl(baseUrl: string, path: string): string {
  // Remove trailing slash from baseUrl
  const base = baseUrl.replace(/\/$/, '');
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${normalizedPath}`;
}

/**
 * Normalise une URL canonique
 */
export function normalizeCanonical(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Remove trailing slash (except for root)
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    
    // Remove default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }
    
    // Remove hash and search params for canonical
    parsed.hash = '';
    parsed.search = '';
    
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Vérifie si une URL est absolue
 */
export function isAbsoluteUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

// ===================================
// VALIDATION
// ===================================

/**
 * Valide la longueur d'un titre SEO
 */
export function validateTitleLength(title: string): {
  valid: boolean;
  length: number;
  status: 'too_short' | 'ideal' | 'acceptable' | 'too_long';
} {
  const length = title.length;
  
  let status: 'too_short' | 'ideal' | 'acceptable' | 'too_long';
  
  if (length < SEO_LIMITS.TITLE_MIN) {
    status = 'too_short';
  } else if (length <= SEO_LIMITS.TITLE_IDEAL) {
    status = 'ideal';
  } else if (length <= SEO_LIMITS.TITLE_MAX) {
    status = 'acceptable';
  } else {
    status = 'too_long';
  }
  
  return {
    valid: status === 'ideal' || status === 'acceptable',
    length,
    status,
  };
}

/**
 * Valide la longueur d'une meta description
 */
export function validateDescriptionLength(description: string): {
  valid: boolean;
  length: number;
  status: 'too_short' | 'ideal' | 'acceptable' | 'too_long';
} {
  const length = description.length;
  
  let status: 'too_short' | 'ideal' | 'acceptable' | 'too_long';
  
  if (length < SEO_LIMITS.DESCRIPTION_MIN) {
    status = 'too_short';
  } else if (length <= SEO_LIMITS.DESCRIPTION_IDEAL) {
    status = 'ideal';
  } else if (length <= SEO_LIMITS.DESCRIPTION_MAX) {
    status = 'acceptable';
  } else {
    status = 'too_long';
  }
  
  return {
    valid: status === 'ideal' || status === 'acceptable',
    length,
    status,
  };
}

// ===================================
// KEYWORD ANALYSIS
// ===================================

/**
 * Calcule la densité d'un mot-clé dans un texte
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  
  // Count total words
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  // Count keyword occurrences
  const keywordWords = normalizedKeyword.split(/\s+/);
  const keywordLength = keywordWords.length;
  
  let occurrences = 0;
  for (let i = 0; i <= words.length - keywordLength; i++) {
    const phrase = words.slice(i, i + keywordLength).join(' ');
    if (phrase === normalizedKeyword) {
      occurrences++;
    }
  }
  
  // Calculate density (percentage)
  return (occurrences / totalWords) * 100;
}

/**
 * Vérifie si un mot-clé est présent dans un texte
 */
export function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

// ===================================
// ROBOTS META
// ===================================

/**
 * Construit la valeur robots meta avec directives modernes
 */
export function buildRobotsMeta(
  index: boolean, 
  follow: boolean,
  options?: {
    maxSnippet?: number;
    maxImagePreview?: 'none' | 'standard' | 'large';
    maxVideoPreview?: number;
  }
): string {
  const directives = [];
  
  // Index/Follow
  directives.push(index ? 'index' : 'noindex');
  directives.push(follow ? 'follow' : 'nofollow');
  
  // Directives modernes
  if (options?.maxSnippet !== undefined) {
    directives.push(`max-snippet:${options.maxSnippet}`);
  } else {
    directives.push('max-snippet:-1'); // Pas de limite
  }
  
  if (options?.maxImagePreview) {
    directives.push(`max-image-preview:${options.maxImagePreview}`);
  } else {
    directives.push('max-image-preview:large'); // Large par défaut
  }
  
  if (options?.maxVideoPreview !== undefined) {
    directives.push(`max-video-preview:${options.maxVideoPreview}`);
  } else {
    directives.push('max-video-preview:-1'); // Pas de limite
  }
  
  return directives.join(', ');
}

// ===================================
// SLUG & PATH
// ===================================

/**
 * Génère un slug SEO-friendly
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non-alphanumériques par -
    .replace(/^-+|-+$/g, ''); // Supprime les - en début/fin
}

/**
 * Construit un chemin pour un content
 */
export function buildContentPath(type: 'post' | 'page', slug: string): string {
  if (type === 'page') {
    return `/${slug}`;
  }
  return `/blog/${slug}`;
}

/**
 * Construit un chemin pour un term
 */
export function buildTermPath(type: 'category' | 'tag', slug: string): string {
  if (type === 'category') {
    return `/category/${slug}`;
  }
  return `/tag/${slug}`;
}
