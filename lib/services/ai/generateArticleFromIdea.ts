import { getOpenAIClient } from './openaiClient';
import { validateArticleContent } from '../articles/articleValidator';
import { ContentTypeRules } from '../setup/contentTypesGenerator';

export interface GenerateArticleInput {
  site: {
    name: string;
    language: string;
    country: string;
    description: string | null;
  };
  idea: {
    title: string;
    angle?: string | null;
  };
  contentType: {
    key: string;
    label: string;
    rulesJson: ContentTypeRules;
  };
  category: {
    name: string;
    slug: string;
  };
  author: {
    id: string;
    roleKey: string;
    displayName: string;
    specialties: string[];
  };
}

export interface GenerateArticleOutput {
  title: string;
  contentHtml: string;
  stats: {
    wordCount: number;
    h2Count: number;
    listCount: number;
  };
  attempts: Array<{
    attemptNumber: number;
    model: string;
    validation: {
      valid: boolean;
      errors: Array<{ code: string; message: string }>;
      stats: any;
    };
    createdAt: string;
  }>;
}

const MAX_RETRIES = 2;

/**
 * Build system prompt with strict HTML constraints
 */
function buildSystemPrompt(rules: ContentTypeRules): string {
  // Support both old format (allowed_tags) and new blueprint format (allowHtmlTags)
  const tags = (rules as any).allowHtmlTags || rules.allowed_tags || ['h2', 'p', 'ul', 'li', 'b', 'i', 'strong', 'em'];
  const allowedTags = tags.join(', ');
  
  return `You are a professional content writer creating high-quality articles in HTML format.

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:

1. OUTPUT FORMAT:
   - Output ONLY valid HTML using these tags: ${allowedTags}
   - NO Markdown syntax
   - NO code blocks (\`\`\`)
   - NO extra formatting outside allowed tags

2. FORBIDDEN CONTENT:
   - NO emojis anywhere in the content
   - NO long dashes (—), use short dash (-) instead
   - NO generic conclusion sections like "En conclusion" or "Pour conclure"

3. STRUCTURE REQUIREMENTS:
   - CRITICAL: You MUST write AT LEAST ${rules.length?.min_words || 1200} words (aim for ${rules.length?.target_words || 1500} words to be safe)
   - Include ${rules.structure?.h2_count_target || 3} H2 sections minimum
   - Each H2 section must have at least ${rules.constraints?.min_paragraphs_per_h2 || 2} paragraphs
   - Maximum ${rules.constraints?.max_lists || 2} lists per article
   - Each list must have at least ${rules.constraints?.min_list_items || 3} items

4. CONTENT QUALITY:
   - Write naturally and professionally
   - Use proper grammar and spelling
   - Provide valuable, accurate information
   - Be specific and detailed

You will receive a JSON object with: title, angle, category, author, site info.
You must return ONLY a JSON object with this exact structure:
{
  "title": "optimized article title",
  "content_html": "complete HTML content"
}`;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(input: GenerateArticleInput): string {
  const { site, idea, contentType, category, author } = input;

  // Support both old and new blueprint formats
  const rules = contentType.rulesJson as any;
  const minWords = rules.minWords || rules.length?.min_words || 1200;
  const targetWords = rules.minWords ? rules.minWords + 200 : rules.length?.target_words || 1500;
  
  let prompt = `Create an article with the following specifications:

SITE CONTEXT:
- Site name: ${site.name}
- Language: ${site.language}
- Country: ${site.country}
${site.description ? `- Description: ${site.description}` : ''}

ARTICLE REQUIREMENTS:
- Content type: ${contentType.label} (${contentType.key})
- Topic/Title: ${idea.title}
${idea.angle ? `- Angle/Perspective: ${idea.angle}` : ''}
- Category: ${category.name}

CRITICAL LENGTH REQUIREMENT:
⚠️ The article MUST contain AT LEAST ${targetWords} words (you can write more, but never less).
This is MANDATORY - count your words and ensure you exceed ${targetWords} words minimum.
Write comprehensive, detailed paragraphs with specific examples and thorough explanations.
Each section should be fully developed with multiple paragraphs to reach the word count.

AUTHOR VOICE:
- Name: ${author.displayName}
- Role: ${author.roleKey}
${author.specialties.length > 0 ? `- Specialties: ${author.specialties.join(', ')}` : ''}

Write a LONG, complete, detailed article that follows all the structural rules.
Be verbose and thorough - add as much relevant detail as possible.
Return ONLY the JSON object with title and content_html fields.`;

  return prompt;
}

/**
 * Build error correction prompt
 */
function buildErrorCorrectionPrompt(
  originalHtml: string,
  errors: Array<{ code: string; message: string }>
): string {
  const errorList = errors.map(e => `- ${e.message}`).join('\n');
  
  return `The generated HTML has validation errors:

${errorList}

Please fix the HTML to address these issues without changing the topic or main content.
Return ONLY the JSON object with the corrected title and content_html.

Original HTML:
${originalHtml}`;
}

/**
 * Parse JSON response from OpenAI
 */
function parseArticleResponse(content: string): { title: string; content_html: string } {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    
    if (!parsed.title || !parsed.content_html) {
      throw new Error('Missing required fields in response');
    }
    
    return {
      title: parsed.title,
      content_html: parsed.content_html,
    };
  } catch (error) {
    // If direct JSON parse fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.title && parsed.content_html) {
        return {
          title: parsed.title,
          content_html: parsed.content_html,
        };
      }
    }
    
    throw new Error('Could not parse article response as JSON');
  }
}

/**
 * Generate article from idea using OpenAI
 */
export async function generateArticleFromIdea(
  input: GenerateArticleInput
): Promise<GenerateArticleOutput> {
  const openai = getOpenAIClient();
  
  // 🔍 DEBUG: Log rules before building prompts
  const rules = input.contentType.rulesJson as any;
  console.log('🔍 [GENERATE DEBUG] Rules received:', {
    type: typeof rules,
    keys: rules ? Object.keys(rules) : 'NULL',
    minWords: rules?.minWords,
    length_min_words: rules?.length?.min_words,
    h2Min: rules?.h2Min,
    allowHtmlTags: rules?.allowHtmlTags,
    constraints: rules?.constraints,
    full: JSON.stringify(rules, null, 2),
  });
  
  const systemPrompt = buildSystemPrompt(input.contentType.rulesJson);
  const userPrompt = buildUserPrompt(input);

  let lastError: Error | null = null;
  let currentHtml: string | null = null;
  const attempts: Array<{
    attemptNumber: number;
    model: string;
    validation: any;
    createdAt: string;
  }> = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const isRetry = attempt > 0;
      
      // Build messages for this attempt
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      if (isRetry && currentHtml) {
        // On retry, send error correction prompt
        const validationResult = validateArticleContent({
          html: currentHtml,
          contentTypeRules: input.contentType.rulesJson,
        });
        
        messages.push({
          role: 'user',
          content: buildErrorCorrectionPrompt(currentHtml, validationResult.errors),
        });
      } else {
        // First attempt, send original prompt
        messages.push({ role: 'user', content: userPrompt });
      }

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse response
      const parsed = parseArticleResponse(responseContent);
      currentHtml = parsed.content_html;

      // Validate
      const validation = validateArticleContent({
        html: currentHtml,
        contentTypeRules: input.contentType.rulesJson,
      });

      // Log this attempt
      attempts.push({
        attemptNumber: attempt + 1,
        model: 'gpt-4o-mini',
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          stats: validation.stats,
        },
        createdAt: new Date().toISOString(),
      });

      if (validation.valid) {
        // Success!
        return {
          title: parsed.title,
          contentHtml: currentHtml,
          stats: {
            wordCount: validation.stats.wordCount,
            h2Count: validation.stats.h2Count,
            listCount: validation.stats.listCount,
          },
          attempts,
        };
      }

      // Validation failed, will retry
      lastError = new Error(
        `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`
      );
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed to generate valid article after ${MAX_RETRIES + 1} attempts. Last error: ${lastError?.message}`
  );
}
