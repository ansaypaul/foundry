import { getOpenAIClient } from './openaiClient';
import { validateArticleContentFromRegistry } from '../articles/articleValidator';
import { ResolvedContentType, getContentTypeById } from '../contentTypes/contentTypeRegistry';
import { buildPromptFromContentType } from '../contentTypes/promptBuilder';
import { runResearch } from '../research/orchestrator';
import { isPerplexityConfigured } from '../research/perplexityClient';

// ====================================
// Article Generation V2 - Using Content Types Registry
// ====================================

export interface GenerateArticleInputV2 {
  siteId: string;
  contentTypeId: string; // UUID from editorial_content_types
  
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

export interface GenerateArticleOutputV2 {
  title: string;
  contentHtml: string;
  
  stats: {
    wordCount: number;
    h2Count: number;
    listCount: number;
  };
  
  metadata: {
    contentTypeId: string;
    contentTypeKey: string;
    contentTypeLabel: string;
    contentTypeSource: 'canonical' | 'overridden';
    overrides: string[];
    attempts: number;
    researchPackId?: string; // NEW: Link to research pack if used
    researchUsed?: boolean;
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

const MAX_RETRIES = 2; // 2 retries = 3 attempts total (0, 1, 2)

/**
 * Generate article from idea using Content Types Registry (V2)
 */
export async function generateArticleFromIdeaV2(
  input: GenerateArticleInputV2
): Promise<GenerateArticleOutputV2> {
  const openai = getOpenAIClient();
  
  // 1. Load content type from registry (with site-specific overrides)
  const contentType = await getContentTypeById(input.siteId, input.contentTypeId);
  
  if (!contentType) {
    throw new Error(`Content type not found or not enabled for this site: ${input.contentTypeId}`);
  }
  
  console.log('[GENERATE V2] Using content type:', {
    key: contentType.key,
    label: contentType.label,
    source: contentType.source,
    overrides: contentType.overrides,
  });
  
  // 2. RESEARCH PHASE (if required and configured)
  let researchPackId: string | undefined;
  let researchBrief: string | undefined;
  
  const researchRequired = await checkResearchRequired(input.contentTypeId);
  
  if (researchRequired && isPerplexityConfigured()) {
    console.log('[GENERATE V2] 🔬 Research phase REQUIRED - Running research...');
    
    try {
      const researchResult = await runResearch({
        siteId: input.siteId,
        contentTypeId: input.contentTypeId,
        topic: input.idea.title,
        angle: input.idea.angle,
      });
      
      researchPackId = researchResult.researchPackId;
      researchBrief = researchResult.finalBrief || undefined;
      
      console.log('[GENERATE V2] ✅ Research completed:', {
        packId: researchPackId,
        briefLength: researchBrief?.length || 0,
        sourcesCount: researchResult.finalSources.length,
      });
    } catch (researchError) {
      console.error('[GENERATE V2] ❌ Research failed:', researchError);
      throw new Error(`Research phase failed: ${researchError instanceof Error ? researchError.message : 'Unknown error'}`);
    }
  } else if (researchRequired && !isPerplexityConfigured()) {
    console.warn('[GENERATE V2] ⚠️ Research required but Perplexity not configured - Skipping research');
  } else {
    console.log('[GENERATE V2] Research phase skipped (not required for this content type)');
  }
  
  // 3. Build prompts using PromptBuilder
  const prompts = buildPromptFromContentType(contentType, {
    title: input.idea.title,
    angle: input.idea.angle,
    category: input.category,
    site: input.site,
    author: input.author,
  });
  
  // Inject research brief if available
  let finalUserPrompt = prompts.userPrompt;
  if (researchBrief) {
    finalUserPrompt = `RESEARCH BRIEF (use this as factual foundation):

${researchBrief}

---

${prompts.userPrompt}

CRITICAL: Base your article on the RESEARCH BRIEF above. Do not invent facts, dates, or claims not present in the brief.`;
  }
  
  console.log('[GENERATE V2] Prompts composed:', {
    systemPromptLength: prompts.systemPrompt.length,
    userPromptLength: finalUserPrompt.length,
    hasResearchBrief: !!researchBrief,
  });
  
  let lastError: Error | null = null;
  let currentHtml: string | null = null;
  let currentTitle: string | null = null;
  const attempts: GenerateArticleOutputV2['attempts'] = [];

  // 4. Generation loop with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const isRetry = attempt > 0;
      
      // Build messages for this attempt
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: prompts.systemPrompt },
      ];

      if (isRetry && currentHtml) {
        // On retry, send error correction prompt
        const validation = validateArticleContentFromRegistry({
          html: currentHtml,
          contentType,
        });
        
        const errorList = validation.errors.map(e => `- ${e.message}`).join('\n');
        
        messages.push({
          role: 'user',
          content: `Your previous attempt has validation errors. Here is the HTML you generated:

TITLE: "${currentTitle || 'Unknown'}"

HTML CONTENT:
${currentHtml}

VALIDATION ERRORS:
${errorList}

CRITICAL INSTRUCTIONS:
1. Take the EXACT HTML above and fix ONLY the validation errors
2. DO NOT change the topic, subject, or rewrite the article
3. DO NOT generate a new article
4. KEEP the same title: "${currentTitle || 'Unknown'}"
5. Apply these specific fixes:
   - If "Tags HTML non autorisés" error: Remove any <html>, <head>, <body> wrapper tags (keep only content tags)
   - If word count too low: Expand existing paragraphs with more details
   - If H2 count wrong: Add or remove H2 sections as needed
   - If H2 section too short: Add more paragraphs to that section

Return the corrected HTML in JSON format: {"title": "${currentTitle || 'Unknown'}", "content_html": "your corrected HTML here"}`,
        });
      } else {
        // First attempt, send original prompt (with research if available)
        messages.push({ role: 'user', content: finalUserPrompt });
      }

      console.log(`\n========================================`);
      console.log(`[GENERATE V2] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      console.log(`========================================`);

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
      currentTitle = parsed.title;

      // Log raw HTML for debugging (start AND end)
      console.log(`\n[GENERATE V2] Attempt ${attempt + 1} - RAW HTML (first 500 chars):`);
      console.log(currentHtml.substring(0, 500));
      console.log(`\n[GENERATE V2] Attempt ${attempt + 1} - RAW HTML (last 300 chars):`);
      console.log(currentHtml.substring(Math.max(0, currentHtml.length - 300)));
      console.log(`\n[GENERATE V2] Attempt ${attempt + 1} - HTML length: ${currentHtml.length} chars`);
      
      // Check for problematic tags
      const hasBadTags = /<html|<head|<body|<meta|<title|<!DOCTYPE/i.test(currentHtml);
      if (hasBadTags) {
        console.log(`⚠️ [GENERATE V2] WARNING: Document structure tags detected in HTML!`);
      }

      // Validate using new validator
      const validation = validateArticleContentFromRegistry({
        html: currentHtml,
        contentType,
      });

      // Log this attempt WITH FULL HTML content for debugging
      attempts.push({
        attemptNumber: attempt + 1,
        model: 'gpt-4o-mini',
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          stats: validation.stats,
        },
        createdAt: new Date().toISOString(),
      } as any);

      console.log(`\n[GENERATE V2] Attempt ${attempt + 1} - Validation result:`);
      console.log(`  ✓ Valid: ${validation.valid}`);
      console.log(`  ✓ Errors count: ${validation.errors.length}`);
      if (validation.errors.length > 0) {
        console.log(`  ✓ Errors:`);
        validation.errors.forEach(err => {
          console.log(`    - [${err.code}] ${err.message}`);
        });
      }
      console.log(`  ✓ Stats:`, validation.stats);

      if (validation.valid) {
        // Success!
        console.log(`\n✅ [GENERATE V2] SUCCESS after ${attempt + 1} attempt(s)!`);
        console.log(`========================================\n`);
        return {
          title: parsed.title,
          contentHtml: currentHtml,
          stats: {
            wordCount: validation.stats.wordCount,
            h2Count: validation.stats.h2Count,
            listCount: validation.stats.listCount,
          },
          metadata: {
            contentTypeId: contentType.id,
            contentTypeKey: contentType.key,
            contentTypeLabel: contentType.label,
            contentTypeSource: contentType.source,
            overrides: contentType.overrides,
            attempts: attempt + 1,
            researchPackId,
            researchUsed: !!researchBrief,
          },
          attempts,
        };
      }

      console.log(`\n❌ [GENERATE V2] Attempt ${attempt + 1} FAILED - will retry...`);

      // Validation failed, will retry
      lastError = new Error(
        `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`
      );
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error('[GENERATE V2] Error in attempt:', lastError);
    }
  }

  // All retries exhausted - throw error with attempts data for debugging
  const error: any = new Error(
    `Failed to generate valid article after ${MAX_RETRIES + 1} attempts. Last error: ${lastError?.message}`
  );
  error.attempts = attempts; // Attach attempts to error for debugging
  error.allAttempts = attempts.length;
  
  console.log(`\n❌ [GENERATE V2] ALL ATTEMPTS FAILED`);
  console.log(`Total attempts: ${attempts.length}`);
  console.log(`========================================\n`);
  
  throw error;
}

/**
 * Check if research is required for this content type
 */
async function checkResearchRequired(contentTypeId: string): Promise<boolean> {
  const { getSupabaseAdmin } = await import('@/lib/db/client');
  const supabase = getSupabaseAdmin();
  
  const { data } = await supabase
    .from('editorial_content_types')
    .select('research_required')
    .eq('id', contentTypeId)
    .single();
  
  return data?.research_required ?? false;
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
