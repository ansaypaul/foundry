// ====================================
// Research Extractors - Type Definitions
// ====================================

/**
 * Generic parsed payload structure
 * All extractors must return this structure
 */
export interface ParsedResearchPayload {
  // Content structure
  sections: number;
  items: Array<{
    title: string;
    content: string;
  }>;
  
  // Metadata
  hasDate: boolean;
  hasPricing: boolean;
  hasStats: boolean;
  
  // Sources
  officialSources: string[];
  allSources: string[];
  
  // Content metrics
  contentLength: number;
  
  // Raw for reference
  rawMarkdown: string;
}

/**
 * Extractor interface
 */
export interface ResearchExtractor {
  key: string;
  label: string;
  extract(rawMarkdown: string, urls: string[]): ParsedResearchPayload;
}
