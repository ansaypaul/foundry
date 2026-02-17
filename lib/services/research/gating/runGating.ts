import { ParsedResearchPayload } from '../extractors/types';

// ====================================
// Research Gating Engine
// Dynamic validation of research quality
// ====================================

export interface GatingRules {
  // SIMPLIFIED: Only essential checks
  min_content_length?: number;
  
  // Optional advanced rules (mostly disabled for now)
  min_sources?: number;
  require_official_source?: boolean;
  min_sections?: number;
  min_items?: number;
  must_have_date?: boolean;
  must_have_pricing?: boolean;
  must_have_stats?: boolean;
  must_have_keywords?: string[];
  max_duplicate_ratio?: number;
}

export interface GatingResult {
  pass: boolean;
  reasons: string[];
  metrics: {
    sourcesCount: number;
    officialSourcesCount: number;
    sectionsCount: number;
    itemsCount: number;
    contentLength: number;
    hasDate: boolean;
    hasPricing: boolean;
    hasStats: boolean;
    keywordsFound?: string[];
  };
}

/**
 * Run gating validation on parsed research
 * SIMPLIFIED VERSION: Most checks are optional
 */
export function runGating(
  payload: ParsedResearchPayload,
  rules: GatingRules
): GatingResult {
  const reasons: string[] = [];
  
  // PRIORITY: Content length (always checked)
  if (rules.min_content_length && payload.contentLength < rules.min_content_length) {
    reasons.push(
      `Content too short: ${payload.contentLength} characters, minimum ${rules.min_content_length} required`
    );
  }
  
  // If only content length is required, pass immediately if content is long enough
  const onlyContentLengthRequired = !rules.min_sources && 
                                     !rules.require_official_source && 
                                     !rules.min_sections && 
                                     !rules.min_items &&
                                     !rules.must_have_date &&
                                     !rules.must_have_pricing &&
                                     !rules.must_have_stats;
  
  if (onlyContentLengthRequired && reasons.length === 0) {
    // FAST PATH: Just check content length, everything else is optional
    return {
      pass: true,
      reasons: [],
      metrics: {
        sourcesCount: payload.allSources.length,
        officialSourcesCount: payload.officialSources.length,
        sectionsCount: payload.sections,
        itemsCount: payload.items.length,
        contentLength: payload.contentLength,
        hasDate: payload.hasDate,
        hasPricing: payload.hasPricing,
        hasStats: payload.hasStats,
      },
    };
  }
  
  // Collect metrics
  const metrics = {
    sourcesCount: payload.allSources.length,
    officialSourcesCount: payload.officialSources.length,
    sectionsCount: payload.sections,
    itemsCount: payload.items.length,
    contentLength: payload.contentLength,
    hasDate: payload.hasDate,
    hasPricing: payload.hasPricing,
    hasStats: payload.hasStats,
    keywordsFound: [] as string[],
  };
  
  // 1. Minimum sources
  if (rules.min_sources && payload.allSources.length < rules.min_sources) {
    reasons.push(
      `Insufficient sources: ${payload.allSources.length} found, minimum ${rules.min_sources} required`
    );
  }
  
  // 2. Require official source
  if (rules.require_official_source && payload.officialSources.length === 0) {
    reasons.push(
      `No official source found. At least one official/trusted source is required.`
    );
  }
  
  // 3. Minimum sections
  if (rules.min_sections && payload.sections < rules.min_sections) {
    reasons.push(
      `Insufficient sections: ${payload.sections} found, minimum ${rules.min_sections} required`
    );
  }
  
  // 4. Minimum items (for lists/rankings)
  if (rules.min_items && payload.items.length < rules.min_items) {
    reasons.push(
      `Insufficient items: ${payload.items.length} found, minimum ${rules.min_items} required`
    );
  }
  
  // 5. Minimum content length
  if (rules.min_content_length && payload.contentLength < rules.min_content_length) {
    reasons.push(
      `Content too short: ${payload.contentLength} characters, minimum ${rules.min_content_length} required`
    );
  }
  
  // 6. Must have date
  if (rules.must_have_date && !payload.hasDate) {
    reasons.push(
      `No date information found. Dates are required for this content type.`
    );
  }
  
  // 7. Must have pricing
  if (rules.must_have_pricing && !payload.hasPricing) {
    reasons.push(
      `No pricing information found. Price data is required for this content type.`
    );
  }
  
  // 8. Must have stats
  if (rules.must_have_stats && !payload.hasStats) {
    reasons.push(
      `No statistics found. Statistical data is required for this content type.`
    );
  }
  
  // 9. Must have keywords
  if (rules.must_have_keywords && rules.must_have_keywords.length > 0) {
    const lowerContent = payload.rawMarkdown.toLowerCase();
    const foundKeywords: string[] = [];
    const missingKeywords: string[] = [];
    
    for (const keyword of rules.must_have_keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }
    
    metrics.keywordsFound = foundKeywords;
    
    if (missingKeywords.length > 0) {
      reasons.push(
        `Missing required keywords: ${missingKeywords.join(', ')}`
      );
    }
  }
  
  return {
    pass: reasons.length === 0,
    reasons,
    metrics,
  };
}

/**
 * Generate retry prompt based on gating failures
 */
export function buildRetryPrompt(
  originalPrompt: string,
  gatingResult: GatingResult,
  rules: GatingRules
): string {
  if (gatingResult.pass) {
    return originalPrompt; // No retry needed
  }
  
  const improvements: string[] = [];
  
  // Build specific improvement instructions based on failures
  if (rules.min_sources && gatingResult.metrics.sourcesCount < rules.min_sources) {
    improvements.push(
      `- Provide at least ${rules.min_sources} reliable sources (currently: ${gatingResult.metrics.sourcesCount})`
    );
  }
  
  if (rules.require_official_source && gatingResult.metrics.officialSourcesCount === 0) {
    improvements.push(
      `- Include at least one official/authoritative source (government, organization, publisher)`
    );
  }
  
  if (rules.min_sections && gatingResult.metrics.sectionsCount < rules.min_sections) {
    improvements.push(
      `- Expand coverage with at least ${rules.min_sections} distinct sections (currently: ${gatingResult.metrics.sectionsCount})`
    );
  }
  
  if (rules.min_items && gatingResult.metrics.itemsCount < rules.min_items) {
    improvements.push(
      `- Provide at least ${rules.min_items} items in the ranking/list (currently: ${gatingResult.metrics.itemsCount})`
    );
  }
  
  if (rules.min_content_length && gatingResult.metrics.contentLength < rules.min_content_length) {
    improvements.push(
      `- Expand the content to at least ${rules.min_content_length} characters (currently: ${gatingResult.metrics.contentLength})`
    );
  }
  
  if (rules.must_have_date && !gatingResult.metrics.hasDate) {
    improvements.push(
      `- Include explicit dates with year information`
    );
  }
  
  if (rules.must_have_pricing && !gatingResult.metrics.hasPricing) {
    improvements.push(
      `- Include pricing information with currency`
    );
  }
  
  if (rules.must_have_stats && !gatingResult.metrics.hasStats) {
    improvements.push(
      `- Include statistical data and numbers to support claims`
    );
  }
  
  if (rules.must_have_keywords && rules.must_have_keywords.length > 0) {
    const missing = rules.must_have_keywords.filter(
      kw => !gatingResult.metrics.keywordsFound?.includes(kw)
    );
    if (missing.length > 0) {
      improvements.push(
        `- Cover these required topics: ${missing.join(', ')}`
      );
    }
  }
  
  // Build retry prompt
  return `${originalPrompt}

IMPORTANT IMPROVEMENTS NEEDED:
The previous research was incomplete. Please improve by addressing these specific issues:

${improvements.join('\n')}

Provide a comprehensive research brief that addresses all these requirements.`;
}
