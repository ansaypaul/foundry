import * as cheerio from 'cheerio';
import { ContentTypeRules } from '../setup/contentTypesGenerator';
import { ResolvedContentType } from '../contentTypes/contentTypeRegistry';

// Flexible type that supports both old and new formats
export type FlexibleContentTypeRules = ContentTypeRules | {
  minWords?: number;
  h2Min?: number;
  allowHtmlTags?: string[];
  maxSingleItemLists?: boolean;
  noEmojis?: boolean;
  noLongDash?: boolean;
  // Allow any other properties from legacy format
  [key: string]: any;
};

export interface ValidationError {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  stats: {
    wordCount: number;
    h2Count: number;
    listCount: number;
    paragraphsPerH2: number[];
  };
  metadata?: {
    contentTypeKey?: string;
    contentTypeLabel?: string;
    validatorSource?: 'registry' | 'legacy';
  };
}

/**
 * Count words in text (excluding HTML tags)
 */
function countWords(html: string): number {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Split by whitespace and filter empty strings
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Check if text contains emojis
 */
function containsEmojis(text: string): boolean {
  // Simple emoji detection (Unicode ranges)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

/**
 * Check if text contains em dash (—)
 */
function containsEmDash(text: string): boolean {
  return text.includes('—');
}

/**
 * Parse HTML and extract structure using Cheerio (DOM-based)
 */
function parseHtmlStructure(html: string) {
  const $ = cheerio.load(html);

  // Count H2s
  const h2Els = $('h2').toArray();
  const h2Count = h2Els.length;

  // Count lists
  const listCount = $('ul').length;

  // Count paragraphs per H2 (traverse siblings)
  const paragraphsPerH2: number[] = [];
  
  for (const h2 of h2Els) {
    let pCount = 0;
    let el = $(h2).next();

    while (el.length) {
      const node = el[0] as any;
      const tag =
        node?.tagName?.toLowerCase?.() ||
        node?.name?.toLowerCase?.();

      // stop when next section starts
      if (tag === 'h2') break;

      // count only real paragraphs
      if (tag === 'p') {
        pCount++;
      }

      el = el.next();
    }

    paragraphsPerH2.push(pCount);
  }

  // Count list items per list
  const listItemCounts: number[] = [];
  $('ul').each((i, list) => {
    const liCount = $(list).find('li').length;
    listItemCounts.push(liCount);
  });

  return {
    h2Count,
    listCount,
    paragraphsPerH2,
    listItemCounts,
  };
}

/**
 * Validate article content against NEW content type (from registry)
 */
export function validateArticleContentFromRegistry(args: {
  html: string;
  contentType: ResolvedContentType;
}): ValidationResult {
  const { html, contentType } = args;
  const errors: ValidationError[] = [];
  
  const profile = contentType.validatorProfile || {};
  
  // Parse HTML once (without adding wrapper tags)
  const $ = cheerio.load(html, null, false); // false = don't add html/body wrapper

  // 1. Count words
  const wordCount = countWords(html);

  // 2. Parse structure
  const structure = parseHtmlStructure(html);

  // 3. Word count validation
  const minWords = profile.min_words || 800;
  const maxWords = profile.max_words || null;
  
  // Min words (with 15% tolerance)
  const minWordsWithTolerance = Math.floor(minWords * 0.85);
  if (wordCount < minWordsWithTolerance) {
    errors.push({
      code: 'WORD_COUNT_TOO_LOW',
      message: `L'article doit contenir au moins ${minWords} mots (actuellement ${wordCount}, minimum accepté: ${minWordsWithTolerance})`,
    });
  }
  
  // Max words (if specified)
  if (maxWords && wordCount > maxWords) {
    errors.push({
      code: 'WORD_COUNT_TOO_HIGH',
      message: `L'article ne doit pas dépasser ${maxWords} mots (actuellement ${wordCount})`,
    });
  }

  // 4. H2 count validation
  if (profile.h2_count_exact) {
    // Exact count required (e.g., Top 10)
    if (structure.h2Count !== profile.h2_count_exact) {
      errors.push({
        code: 'H2_COUNT_INCORRECT',
        message: `L'article doit contenir EXACTEMENT ${profile.h2_count_exact} sections H2 (actuellement ${structure.h2Count})`,
      });
    }
  } else {
    // Min/Max range
    if (profile.h2_count_min && structure.h2Count < profile.h2_count_min) {
      errors.push({
        code: 'H2_COUNT_TOO_LOW',
        message: `L'article doit contenir au moins ${profile.h2_count_min} sections H2 (actuellement ${structure.h2Count})`,
      });
    }
    if (profile.h2_count_max && structure.h2Count > profile.h2_count_max) {
      errors.push({
        code: 'H2_COUNT_TOO_HIGH',
        message: `L'article ne doit pas dépasser ${profile.h2_count_max} sections H2 (actuellement ${structure.h2Count})`,
      });
    }
  }

  // 5. Paragraphs per H2 validation
  const minParagraphsPerH2 = profile.min_paragraphs_per_h2 || 0;
  if (minParagraphsPerH2 > 0) {
    for (let i = 0; i < structure.paragraphsPerH2.length; i++) {
      const pCount = structure.paragraphsPerH2[i];
      if (pCount < minParagraphsPerH2) {
        errors.push({
          code: 'H2_SECTION_TOO_SHORT',
          message: `Section H2 ${i + 1} contient seulement ${pCount} paragraphe(s) (minimum: ${minParagraphsPerH2})`,
        });
      }
    }
  }

  // 6. List count validation
  const maxLists = profile.max_lists ?? 2;
  if (structure.listCount > maxLists) {
    errors.push({
      code: 'TOO_MANY_LISTS',
      message: `Maximum ${maxLists} liste(s) autorisée(s) (actuellement ${structure.listCount})`,
    });
  }

  // 7. Forbidden substrings (new feature)
  if (profile.forbidden_substrings && Array.isArray(profile.forbidden_substrings)) {
    for (const forbidden of profile.forbidden_substrings) {
      if (html.includes(forbidden)) {
        errors.push({
          code: 'FORBIDDEN_PATTERN',
          message: `Le texte contient un pattern interdit: "${forbidden}"`,
        });
      }
    }
  }

  // 8. Allowed HTML tags validation
  if (contentType.allowedHtmlTags && contentType.allowedHtmlTags.length > 0) {
    const allowedTags = contentType.allowedHtmlTags.map(t => t.toLowerCase());
    
    // Extract tags directly from HTML string (to avoid Cheerio auto-wrapping issues)
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    const foundTags = new Set<string>();
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
      foundTags.add(match[1].toLowerCase());
    }
    
    const uniqueTags = Array.from(foundTags);
    const disallowedTags = uniqueTags.filter(tag => !allowedTags.includes(tag));
    
    if (disallowedTags.length > 0) {
      const allowedList = allowedTags.join(', ');
      errors.push({
        code: 'DISALLOWED_HTML_TAGS',
        message: `Tags HTML non autorisés détectés: ${disallowedTags.join(', ')}. Tags autorisés: ${allowedList}. N'utilisez pas de structure document HTML (<html>, <head>, <body>).`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      wordCount,
      h2Count: structure.h2Count,
      listCount: structure.listCount,
      paragraphsPerH2: structure.paragraphsPerH2,
    },
    metadata: {
      contentTypeKey: contentType.key,
      contentTypeLabel: contentType.label,
      validatorSource: 'registry',
    },
  };
}

/**
 * Validate article content against LEGACY content type rules (backward compatibility)
 */
export function validateArticleContent(args: {
  html: string;
  contentTypeRules: ContentTypeRules;
}): ValidationResult {
  const { html, contentTypeRules } = args;
  const errors: ValidationError[] = [];
  
  // Cast for flexible access (supports both old and new blueprint formats)
  const rules = contentTypeRules as any;
  
  // Parse HTML once
  const $ = cheerio.load(html);

  // 1. Count words
  const wordCount = countWords(html);

  // 2. Parse structure
  const structure = parseHtmlStructure(html);

  // 3. Word count validation (avec tolérance de 15%)
  const minWords = rules.minWords || rules.length?.min_words || 1200;
  const minWordsWithTolerance = Math.floor(minWords * 0.85);
  if (wordCount < minWordsWithTolerance) {
    errors.push({
      code: 'WORD_COUNT_TOO_LOW',
      message: `L'article doit contenir au moins ${minWords} mots (actuellement ${wordCount}, minimum accepté: ${minWordsWithTolerance})`,
    });
  }

  // 4. Emoji validation
  const noEmojis = rules.noEmojis ?? rules.constraints?.no_emojis ?? true;
  if (noEmojis && containsEmojis(html)) {
    errors.push({
      code: 'CONTAINS_EMOJIS',
      message: 'Les emojis ne sont pas autorisés dans ce type de contenu',
    });
  }

  // 5. Em dash validation
  const noEmDash = rules.noLongDash ?? rules.constraints?.no_em_dash ?? true;
  if (noEmDash && containsEmDash(html)) {
    errors.push({
      code: 'CONTAINS_EM_DASH',
      message: 'Les tirets longs (—) ne sont pas autorisés, utilisez des tirets courts (-)',
    });
  }

  // 6. List count validation
  const maxLists = rules.maxSingleItemLists === false ? 999 : (rules.constraints?.max_lists || 2);
  if (structure.listCount > maxLists) {
    errors.push({
      code: 'TOO_MANY_LISTS',
      message: `Maximum ${maxLists} liste(s) autorisée(s) (actuellement ${structure.listCount})`,
    });
  }

  // 7. List items validation
  const minListItems = rules.constraints?.min_list_items || 3;
  for (let i = 0; i < structure.listItemCounts.length; i++) {
    const itemCount = structure.listItemCounts[i];
    if (itemCount < minListItems) {
      errors.push({
        code: 'LIST_TOO_SHORT',
        message: `Liste ${i + 1} doit contenir au moins ${minListItems} éléments (actuellement ${itemCount})`,
      });
    }
  }

  // 8. Paragraphs per H2 validation
  const minParagraphsPerH2 = rules.constraints?.min_paragraphs_per_h2 ?? 0;

  if (minParagraphsPerH2 > 0) {
    for (let i = 0; i < structure.paragraphsPerH2.length; i++) {
      const pCount = structure.paragraphsPerH2[i];
      if (pCount < minParagraphsPerH2) {
        errors.push({
          code: "H2_SECTION_TOO_SHORT",
          message: `Une section contient seulement ${pCount} paragraphe(s) (minimum: ${minParagraphsPerH2}).`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      wordCount,
      h2Count: structure.h2Count,
      listCount: structure.listCount,
      paragraphsPerH2: structure.paragraphsPerH2,
    },
    metadata: {
      validatorSource: 'legacy',
    },
  };
}

/**
 * Get content type rules by key
 */
export async function getContentTypeRules(
  siteId: string,
  contentTypeKey: string
): Promise<ContentTypeRules | null> {
  const { getSupabaseAdmin } = await import('@/lib/db/client');
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('content_types')
    .select('rules_json')
    .eq('site_id', siteId)
    .eq('key', contentTypeKey)
    .single();

  if (error || !data) {
    return null;
  }

  return data.rules_json as ContentTypeRules;
}
