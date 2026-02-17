import { ResearchExtractor, ParsedResearchPayload } from './types';
import { isOfficialSource } from '../perplexityClient';

// ====================================
// Generic Article Markdown Extractor
// ====================================
// Extracts structure from markdown research brief

export const articleMdExtractor: ResearchExtractor = {
  key: 'article_md',
  label: 'Generic Article Markdown',
  
  extract(rawMarkdown: string, urls: string[]): ParsedResearchPayload {
    // Extract sections (headers)
    const sectionRegex = /^#{1,3}\s+(.+)$/gm;
    const sections: Array<{ title: string; content: string }> = [];
    let sectionCount = 0;
    
    let match;
    while ((match = sectionRegex.exec(rawMarkdown)) !== null) {
      sectionCount++;
      sections.push({
        title: match[1].trim(),
        content: '', // We don't extract full content per section for now
      });
    }
    
    // Extract items (list items or numbered lists)
    // More flexible regex that handles indentation and various formats
    const itemRegex = /^\s*(?:\d+[\.\)]\s+|[-*+]\s+|[•●○]\s+)(.+)$/gm;
    const items: Array<{ title: string; content: string }> = [];
    
    let itemMatch;
    while ((itemMatch = itemRegex.exec(rawMarkdown)) !== null) {
      const title = itemMatch[1].trim();
      // Skip very short items (likely noise) and very long ones (likely paragraphs)
      if (title.length > 10 && title.length < 200) {
        items.push({
          title,
          content: '',
        });
      }
    }
    
    console.log(`[EXTRACTOR] Found ${items.length} items in markdown (length: ${rawMarkdown.length})`);
    
    // Detect dates (various formats)
    const datePatterns = [
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, // 12/31/2026, 31-12-2026
      /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/, // 2026-12-31
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i, // January 15, 2026
      /\b\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b/i, // 15 janvier 2026
      /\b202[0-9]\b/, // Just year 2020-2029
    ];
    
    const hasDate = datePatterns.some(pattern => pattern.test(rawMarkdown));
    
    // Detect pricing ($, €, £, etc.)
    const hasPricing = /(?:\$|€|£|USD|EUR)\s*\d+/i.test(rawMarkdown);
    
    // Detect statistics/numbers
    const hasStats = /\d+(?:\.\d+)?\s*(?:%|percent|million|billion|thousand)/i.test(rawMarkdown);
    
    // Classify sources
    const officialSources = urls.filter(url => isOfficialSource(url));
    
    return {
      sections: sectionCount,
      items,
      hasDate,
      hasPricing,
      hasStats,
      officialSources,
      allSources: urls,
      contentLength: rawMarkdown.length,
      rawMarkdown,
    };
  },
};
