import { getSupabaseAdmin } from '@/lib/db/client';
import { getOpenAIClient } from './openaiClient';

// ===================================
// TYPES
// ===================================

export interface CategoryEnrichmentInput {
  siteId: string;
  categoryIds?: string[]; // If empty, process all
  mode: 'fill_only_empty' | 'overwrite';
}

export interface CategoryEnrichmentProposal {
  term_id: string;
  slug: string;
  name: string;
  currentDescription: string | null;
  currentSeoTitle: string | null;
  currentSeoDescription: string | null;
  proposedSeoTitle: string;
  proposedSeoDescription: string;
  proposedLongDescriptionHtml: string;
}

export interface CategoryEnrichmentResult {
  proposals: CategoryEnrichmentProposal[];
  aiJobId: string;
}

// ===================================
// BUILD ENRICHMENT PROPOSALS
// ===================================

/**
 * Generate AI-powered content for categories
 * Returns proposals that can be previewed before applying
 */
export async function buildCategoryEnrichmentProposals(
  input: CategoryEnrichmentInput
): Promise<CategoryEnrichmentResult> {
  const supabase = getSupabaseAdmin();
  const openai = getOpenAIClient();

  // Load site
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, description, language, country, site_type')
    .eq('id', input.siteId)
    .single();

  if (!site) {
    throw new Error('Site not found');
  }

  // Load categories
  let categoriesQuery = supabase
    .from('terms')
    .select('id, name, slug, description, type')
    .eq('site_id', input.siteId)
    .eq('type', 'category');

  if (input.categoryIds && input.categoryIds.length > 0) {
    categoriesQuery = categoriesQuery.in('id', input.categoryIds);
  }

  const { data: categories } = await categoriesQuery;

  if (!categories || categories.length === 0) {
    throw new Error('No categories found');
  }

  // Load existing SEO meta
  const categoryIds = categories.map((c) => c.id);
  const { data: existingSeoMeta } = await supabase
    .from('seo_meta')
    .select('entity_id, seo_title, seo_description, seo_og_title, seo_og_description')
    .eq('entity_type', 'term')
    .in('entity_id', categoryIds);

  const seoMetaMap = new Map(
    (existingSeoMeta || []).map((s) => [s.entity_id, s])
  );

  // Create AI job
  const { data: aiJob, error: aiJobError } = await supabase
    .from('ai_job')
    .insert({
      site_id: input.siteId,
      kind: 'enrich_categories',
      status: 'running',
      started_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini',
      input_json: {
        siteId: input.siteId,
        siteName: site.name,
        siteDescription: site.description,
        siteType: site.site_type,
        language: site.language,
        categoryCount: categories.length,
        categoryNames: categories.map((c) => c.name),
        mode: input.mode,
      },
    })
    .select()
    .single();

  if (aiJobError || !aiJob) {
    console.error('AI Job creation error:', aiJobError);
    throw new Error(`Failed to create AI job: ${aiJobError?.message || 'Unknown error'}`);
  }

  try {
    // Build system prompt
    const systemPrompt = buildCategoryEnrichmentSystemPrompt(site);

    // Build user prompt
    const userPrompt = buildCategoryEnrichmentUserPrompt(site, categories);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse response
    const parsed = JSON.parse(responseContent);

    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error('Invalid response format');
    }

    // Validate and build proposals
    const proposals: CategoryEnrichmentProposal[] = categories.map((category) => {
      const generated = parsed.categories.find(
        (c: any) => c.slug === category.slug || c.term_id === category.id
      );

      if (!generated) {
        throw new Error(`Missing generated content for category: ${category.slug}`);
      }

      // Validate constraints
      validateCategoryEnrichment(generated);

      const existingSeo = seoMetaMap.get(category.id);

      return {
        term_id: category.id,
        slug: category.slug,
        name: category.name,
        currentDescription: category.description,
        currentSeoTitle: existingSeo?.seo_title || null,
        currentSeoDescription: existingSeo?.seo_description || null,
        proposedSeoTitle: generated.seo_title,
        proposedSeoDescription: generated.seo_description,
        proposedLongDescriptionHtml: generated.long_description_html,
      };
    });

    // Update AI job to done
    await supabase
      .from('ai_job')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        output_json: {
          proposals: proposals.map((p) => ({
            term_id: p.term_id,
            slug: p.slug,
            seo_title: p.proposedSeoTitle,
            seo_description: p.proposedSeoDescription,
          })),
          rawResponse: parsed,
        },
      })
      .eq('id', aiJob.id);

    return {
      proposals,
      aiJobId: aiJob.id,
    };
  } catch (error) {
    // Update AI job to error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('ai_job')
      .update({
        status: 'error',
        error_code: 'GENERATION_FAILED',
        error_message: errorMessage,
        finished_at: new Date().toISOString(),
      })
      .eq('id', aiJob.id);

    throw error;
  }
}

/**
 * Build system prompt for category enrichment
 */
function buildCategoryEnrichmentSystemPrompt(site: any): string {
  return `You are a professional SEO content writer specializing in ${site.site_type || 'editorial'} websites.

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON in this exact structure:
{
  "categories": [
    {
      "term_id": "uuid",
      "slug": "category-slug",
      "seo_title": "Category Name | ${site.name}",
      "seo_description": "150-160 chars max, single paragraph",
      "long_description_html": "<p>Paragraph 1.</p><p>Paragraph 2.</p><p>Paragraph 3.</p>"
    }
  ]
}

2. SEO DESCRIPTION constraints:
   - 140-170 characters (aim for 155-160 for best SERP display)
   - One or two short sentences
   - Natural, engaging, informative
   - NO emojis
   - NO long dash (—), use regular dash (-) or comma
   - ${site.language === 'fr' ? 'Write in French' : 'Write in English'}

3. LONG DESCRIPTION HTML constraints:
   - 80-300 words total (flexible range, quality over quantity)
   - HTML format with <p> tags ONLY
   - 2-3 paragraphs minimum
   - Professional editorial tone
   - Relevant to category topic
   - NO emojis
   - NO long dash (—)
   - NO generic conclusions like "Stay tuned" or "Join us"
   - Be specific and informative about what readers will find
   - IMPORTANT: Write naturally, don't pad with filler. Quality > length.

4. SEO TITLE constraints:
   - Format: "{Category Name} | ${site.name}"
   - 45-65 characters preferred
   - Natural and readable

${site.language === 'fr' ? 'IMPORTANT: Écrivez tout en français.' : ''}
${site.description ? `\nSite context: ${site.description}` : ''}`;
}

/**
 * Build user prompt for category enrichment
 */
function buildCategoryEnrichmentUserPrompt(site: any, categories: any[]): string {
  const categoryList = categories
    .map((c) => `- "${c.name}" (slug: ${c.slug})`)
    .join('\n');

  return `Generate SEO content and descriptions for these categories on ${site.name}:

${categoryList}

Context:
- Site: ${site.name}
- Type: ${site.site_type || 'editorial'}
- Language: ${site.language}
${site.description ? `- Description: ${site.description}` : ''}

For EACH category, write:

1. **seo_title**: "{Category Name} | ${site.name}" (simple format)

2. **seo_description** (140-170 chars):
   - ONE engaging sentence about what readers find in this category
   - Natural and informative tone
   - Aim for 155-160 characters for optimal SERP display

3. **long_description_html** (80-300 words):
   - 2-3 paragraphs in HTML <p> tags
   - Explain what this category covers
   - Be specific and relevant
   - Professional editorial tone
   - Write naturally, be concise

CRITICAL RULES:
- NO emojis anywhere
- NO long dash (—), use regular dash (-) or comma
- ${site.language === 'fr' ? 'Write everything in French' : 'Write everything in English'}
- Be natural and professional, not promotional

Output the JSON now:`;
}

/**
 * Validate category enrichment output
 * Relaxed constraints for better success rate
 */
export function validateCategoryEnrichment(generated: any): void {
  // Check seo_description length (relaxed to 180 chars)
  if (!generated.seo_description || generated.seo_description.length > 180) {
    throw new Error(
      `SEO description too long: ${generated.seo_description?.length || 0} chars (max 180)`
    );
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  
  if (emojiRegex.test(generated.seo_description) || emojiRegex.test(generated.long_description_html)) {
    throw new Error('Content contains emojis (forbidden)');
  }

  // Check for long dash
  if (generated.seo_description.includes('—') || generated.long_description_html.includes('—')) {
    throw new Error('Content contains long dash — (forbidden)');
  }

  // Check HTML format
  if (!generated.long_description_html.includes('<p>')) {
    throw new Error('Long description must contain <p> tags');
  }

  // Check word count (relaxed: 60-500 words with tolerance)
  const text = generated.long_description_html.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
  
  if (wordCount < 60 || wordCount > 500) {
    throw new Error(`Long description word count out of range: ${wordCount} (60-500 expected)`);
  }
}

// ===================================
// APPLY ENRICHMENT
// ===================================

/**
 * Apply category enrichment proposals
 * Respects mode: fill_only_empty or overwrite
 */
export async function applyCategoryEnrichment(
  siteId: string,
  aiJobId: string,
  selectedProposals: CategoryEnrichmentProposal[],
  mode: 'fill_only_empty' | 'overwrite'
): Promise<{ appliedCount: number; skippedCount: number }> {
  const supabase = getSupabaseAdmin();

  let appliedCount = 0;
  let skippedCount = 0;
  const appliedIds: string[] = [];

  for (const proposal of selectedProposals) {
    // Update term.description
    const shouldUpdateDescription =
      mode === 'overwrite' || !proposal.currentDescription;

    if (shouldUpdateDescription) {
      await supabase
        .from('terms')
        .update({
          description: proposal.proposedLongDescriptionHtml,
        })
        .eq('id', proposal.term_id);
    }

    // Upsert SEO meta
    const shouldUpdateSeoTitle =
      mode === 'overwrite' || !proposal.currentSeoTitle;
    const shouldUpdateSeoDescription =
      mode === 'overwrite' || !proposal.currentSeoDescription;

    if (shouldUpdateSeoTitle || shouldUpdateSeoDescription) {
      const seoUpdates: any = {
        entity_type: 'term',
        entity_id: proposal.term_id,
      };

      if (shouldUpdateSeoTitle) {
        seoUpdates.seo_title = proposal.proposedSeoTitle;
      }

      if (shouldUpdateSeoDescription) {
        seoUpdates.seo_description = proposal.proposedSeoDescription;
        seoUpdates.seo_og_description = proposal.proposedSeoDescription;
      }

      await supabase.from('seo_meta').upsert(seoUpdates, {
        onConflict: 'entity_type,entity_id',
      });
    }

    if (shouldUpdateDescription || shouldUpdateSeoTitle || shouldUpdateSeoDescription) {
      appliedIds.push(proposal.term_id);
      appliedCount++;
    } else {
      skippedCount++;
    }
  }

  // Update AI job with applied IDs
  await supabase
    .from('ai_job')
    .update({
      output_json: supabase.rpc('jsonb_set', {
        target: 'output_json',
        path: '{appliedIds}',
        new_value: JSON.stringify(appliedIds),
      }) as any,
    })
    .eq('id', aiJobId);

  return { appliedCount, skippedCount };
}
