import { ResearchExtractor } from './types';
import { articleMdExtractor } from './articleMd';

// ====================================
// Extractor Registry
// ====================================
// Maps extractor keys to implementations

const extractors: Record<string, ResearchExtractor> = {
  article_md: articleMdExtractor,
  // Future: list_md, review_md, comparison_md, etc.
};

/**
 * Get extractor by key
 */
export function getExtractor(key: string): ResearchExtractor | null {
  return extractors[key] || null;
}

/**
 * List all available extractors
 */
export function listExtractors(): ResearchExtractor[] {
  return Object.values(extractors);
}

// Re-export types
export * from './types';
