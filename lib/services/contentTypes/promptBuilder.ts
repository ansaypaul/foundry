import { ResolvedContentType } from './contentTypeRegistry';

// ====================================
// Prompt Builder Service
// Composes final AI prompts from content type + article context
// ====================================

export interface ArticleContext {
  title: string;
  angle?: string | null;
  category: {
    name: string;
    slug: string;
  };
  site: {
    name: string;
    language: string;
    country: string;
    description?: string | null;
  };
  author?: {
    displayName: string;
    roleKey: string;
    specialties: string[];
  };
}

export interface ComposedPrompts {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    contentTypeKey: string;
    contentTypeLabel: string;
    source: 'canonical' | 'overridden';
    overrides: string[];
  };
}

/**
 * Build complete AI prompts from content type + article context
 * Composition order:
 * 1. Platform base rules
 * 2. Content type system prompt
 * 3. Content type format prompt
 * 4. Content type plan prompt
 * 5. Content type style prompt
 * 6. Article context
 * 7. Template schema translated to instructions
 */
export function buildPromptFromContentType(
  contentType: ResolvedContentType,
  context: ArticleContext
): ComposedPrompts {
  const systemPrompt = buildSystemPrompt(contentType);
  const userPrompt = buildUserPrompt(contentType, context);
  
  return {
    systemPrompt,
    userPrompt,
    metadata: {
      contentTypeKey: contentType.key,
      contentTypeLabel: contentType.label,
      source: contentType.source,
      overrides: contentType.overrides,
    },
  };
}

/**
 * Build system prompt (instructions for the AI model)
 */
function buildSystemPrompt(contentType: ResolvedContentType): string {
  const parts: string[] = [];
  
  // 1. Platform base rules
  parts.push(`You are Foundry AI, a professional content writer creating high-quality articles.

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY valid JSON matching this exact structure:
  {
    "title": "optimized article title",
    "content_html": "complete HTML content"
  }
- NO Markdown syntax
- NO code blocks (\`\`\`)
- NO commentary outside the JSON structure

CRITICAL HTML FORMAT:
- content_html should contain ONLY the article content (paragraphs, headings, lists)
- DO NOT wrap content in <html>, <head>, or <body> tags
- DO NOT include DOCTYPE, meta tags, or any document structure
- Start directly with content tags like <p> or <h2>
- Example correct format: "<p>Introduction...</p><h2>Section 1</h2><p>Content...</p>"`);
  
  // 2. Content type system prompt (if exists)
  if (contentType.systemPrompt) {
    parts.push(`\n\nCONTENT TYPE: ${contentType.label.toUpperCase()}\n${contentType.systemPrompt}`);
  }
  
  // 3. Format prompt (HTML rules)
  if (contentType.formatPrompt) {
    parts.push(`\n\nFORMAT RULES:\n${contentType.formatPrompt}`);
  }
  
  // Additional format rules from allowed_html_tags and forbidden_patterns
  if (contentType.allowedHtmlTags && contentType.allowedHtmlTags.length > 0) {
    const tags = contentType.allowedHtmlTags.join(', ');
    parts.push(`\n\nALLOWED HTML TAGS: ${tags}\nYou MUST use ONLY these tags. No other HTML tags are permitted.`);
  }
  
  if (contentType.forbiddenPatterns && contentType.forbiddenPatterns.length > 0) {
    const patterns = contentType.forbiddenPatterns.map(p => `"${p}"`).join(', ');
    parts.push(`\n\nFORBIDDEN PATTERNS: ${patterns}\nYou MUST NOT include these strings anywhere in your content.`);
  }
  
  // 4. Plan prompt (structure instructions)
  if (contentType.planPrompt) {
    parts.push(`\n\nSTRUCTURE & PLAN:\n${contentType.planPrompt}`);
  }
  
  // 5. Template schema translated to instructions
  const templateInstructions = translateTemplateSchemaToInstructions(contentType.templateSchema);
  if (templateInstructions) {
    parts.push(`\n\nTEMPLATE REQUIREMENTS:\n${templateInstructions}`);
  }
  
  // 6. Validation rules translated to instructions
  const validationInstructions = translateValidationProfileToInstructions(contentType.validatorProfile);
  if (validationInstructions) {
    parts.push(`\n\nVALIDATION REQUIREMENTS (CRITICAL):\n${validationInstructions}`);
  }
  
  // 7. Style prompt (tone/voice)
  if (contentType.stylePrompt) {
    parts.push(`\n\nSTYLE & TONE:\n${contentType.stylePrompt}`);
  }
  
  return parts.join('\n');
}

/**
 * Build user prompt (specific article instructions)
 */
function buildUserPrompt(
  contentType: ResolvedContentType,
  context: ArticleContext
): string {
  const parts: string[] = [];
  
  parts.push(`Create an article with the following specifications:

SITE CONTEXT:
- Site name: ${context.site.name}
- Language: ${context.site.language}
- Country: ${context.site.country}`);
  
  if (context.site.description) {
    parts.push(`- Site description: ${context.site.description}`);
  }
  
  parts.push(`\nARTICLE REQUIREMENTS:
- Content type: ${contentType.label} (${contentType.key})
- Topic/Title: ${context.title}`);
  
  if (context.angle) {
    parts.push(`- Angle/Perspective: ${context.angle}`);
  }
  
  parts.push(`- Category: ${context.category.name}`);
  
  if (context.author) {
    parts.push(`\nAUTHOR VOICE:
- Name: ${context.author.displayName}
- Role: ${context.author.roleKey}`);
    
    if (context.author.specialties.length > 0) {
      parts.push(`- Specialties: ${context.author.specialties.join(', ')}`);
    }
  }
  
  // Add word count emphasis
  const minWords = contentType.validatorProfile?.min_words || 800;
  parts.push(`\n⚠️ CRITICAL LENGTH REQUIREMENT:
The article MUST contain AT LEAST ${minWords} words.
This is MANDATORY. Write comprehensive, detailed content with specific examples.
Each section should be fully developed to reach the required word count.`);
  
  parts.push(`\nWrite a complete, detailed article following all requirements above.
Return ONLY the JSON object with "title" and "content_html" fields.`);
  
  return parts.join('\n');
}

/**
 * Translate template_schema to human-readable instructions
 */
function translateTemplateSchemaToInstructions(templateSchema: any): string | null {
  if (!templateSchema || !templateSchema.blocks) {
    return null;
  }
  
  const instructions: string[] = [];
  
  for (const block of templateSchema.blocks) {
    if (block.type === 'intro' && block.min_paragraphs) {
      instructions.push(`- Introduction: minimum ${block.min_paragraphs} paragraph(s)`);
    }
    
    if (block.type === 'items' && block.count_exact) {
      instructions.push(`- Main content: EXACTLY ${block.count_exact} H2 sections`);
    }
    
    if (block.type === 'sections') {
      if (block.count_exact) {
        instructions.push(`- EXACTLY ${block.count_exact} H2 sections`);
      } else if (block.count_min && block.count_max) {
        instructions.push(`- Between ${block.count_min} and ${block.count_max} H2 sections`);
      } else if (block.count_min) {
        instructions.push(`- Minimum ${block.count_min} H2 sections`);
      }
    }
    
    if (block.min_paragraphs_per_h2) {
      instructions.push(`- Each H2 section: minimum ${block.min_paragraphs_per_h2} paragraph(s)`);
    }
  }
  
  if (templateSchema.rules) {
    if (templateSchema.rules.max_lists !== undefined) {
      instructions.push(`- Maximum ${templateSchema.rules.max_lists} list(s) (<ul>) in total`);
    }
    
    if (templateSchema.rules.no_visible_conclusion) {
      instructions.push(`- NO visible conclusion section (integrate final thoughts naturally)`);
    }
  }
  
  return instructions.length > 0 ? instructions.join('\n') : null;
}

/**
 * Translate validator_profile to human-readable instructions
 */
function translateValidationProfileToInstructions(validatorProfile: any): string | null {
  if (!validatorProfile) {
    return null;
  }
  
  const instructions: string[] = [];
  
  if (validatorProfile.min_words) {
    instructions.push(`- MINIMUM ${validatorProfile.min_words} words (count carefully!)`);
  }
  
  if (validatorProfile.max_words) {
    instructions.push(`- MAXIMUM ${validatorProfile.max_words} words`);
  }
  
  if (validatorProfile.h2_count_exact) {
    instructions.push(`- EXACTLY ${validatorProfile.h2_count_exact} H2 sections (no more, no less)`);
  }
  
  if (validatorProfile.h2_count_min && validatorProfile.h2_count_max) {
    instructions.push(`- Between ${validatorProfile.h2_count_min} and ${validatorProfile.h2_count_max} H2 sections`);
  } else if (validatorProfile.h2_count_min) {
    instructions.push(`- Minimum ${validatorProfile.h2_count_min} H2 sections`);
  } else if (validatorProfile.h2_count_max) {
    instructions.push(`- Maximum ${validatorProfile.h2_count_max} H2 sections`);
  }
  
  if (validatorProfile.min_paragraphs_per_h2) {
    instructions.push(`- Each H2 section: minimum ${validatorProfile.min_paragraphs_per_h2} paragraph(s)`);
  }
  
  if (validatorProfile.max_lists !== undefined) {
    instructions.push(`- Maximum ${validatorProfile.max_lists} list(s) (<ul>)`);
  }
  
  if (validatorProfile.forbidden_substrings && validatorProfile.forbidden_substrings.length > 0) {
    const forbidden = validatorProfile.forbidden_substrings.map((s: string) => `"${s}"`).join(', ');
    instructions.push(`- FORBIDDEN strings: ${forbidden} (do not include these anywhere)`);
  }
  
  return instructions.length > 0 ? instructions.join('\n') : null;
}

/**
 * Get word count requirement from content type
 */
export function getWordCountRequirement(contentType: ResolvedContentType): {
  min: number;
  max: number | null;
  target: number;
} {
  const min = contentType.validatorProfile?.min_words || 800;
  const max = contentType.validatorProfile?.max_words || null;
  const target = max ? Math.floor((min + max) / 2) : min + 200;
  
  return { min, max, target };
}

/**
 * Get H2 count requirement from content type
 */
export function getH2CountRequirement(contentType: ResolvedContentType): {
  exact: number | null;
  min: number | null;
  max: number | null;
} {
  return {
    exact: contentType.validatorProfile?.h2_count_exact || null,
    min: contentType.validatorProfile?.h2_count_min || null,
    max: contentType.validatorProfile?.h2_count_max || null,
  };
}
