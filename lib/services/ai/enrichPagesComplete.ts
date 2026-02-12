import { getSupabaseAdmin } from '@/lib/db/client';
import { getOpenAIClient } from './openaiClient';

// ===================================
// TYPES
// ===================================

export interface PageEnrichmentInput {
  siteId: string;
  pageIds?: string[]; // If empty, process all essential pages
  mode: 'fill_only_empty' | 'overwrite';
}

export interface PageEnrichmentProposal {
  page_id: string;
  slug: string;
  title: string;
  pageType: string | null;
  currentContentHtml: string | null;
  proposedContentHtml: string;
  wordCount: number;
}

export interface PageEnrichmentResult {
  proposals: PageEnrichmentProposal[];
  aiJobId: string;
}

// Essential page slugs we support
const ESSENTIAL_PAGE_SLUGS = [
  'a-propos',
  'contact',
  'mentions-legales',
  'politique-de-confidentialite',
  'conditions-generales-utilisation',
];

// ===================================
// BUILD ENRICHMENT PROPOSALS
// ===================================

/**
 * Generate AI-powered content for essential pages
 * Returns proposals that can be previewed before applying
 */
export async function buildPageEnrichmentProposals(
  input: PageEnrichmentInput
): Promise<PageEnrichmentResult> {
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

  // Load essential pages
  let pagesQuery = supabase
    .from('content')
    .select('id, title, slug, content_html, page_type, type')
    .eq('site_id', input.siteId)
    .eq('type', 'page')
    .in('slug', ESSENTIAL_PAGE_SLUGS);

  if (input.pageIds && input.pageIds.length > 0) {
    pagesQuery = pagesQuery.in('id', input.pageIds);
  }

  const { data: pages } = await pagesQuery;

  if (!pages || pages.length === 0) {
    throw new Error('No essential pages found');
  }

  // Create AI job
  const { data: aiJob, error: aiJobError } = await supabase
    .from('ai_job')
    .insert({
      site_id: input.siteId,
      kind: 'enrich_pages',
      status: 'running',
      started_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini',
      input_json: {
        siteId: input.siteId,
        siteName: site.name,
        siteDescription: site.description,
        siteType: site.site_type,
        language: site.language,
        country: site.country,
        pageCount: pages.length,
        pageSlugs: pages.map((p) => p.slug),
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
    const systemPrompt = buildPageEnrichmentSystemPrompt(site);

    // Build user prompt
    const userPrompt = buildPageEnrichmentUserPrompt(site, pages);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse response
    const parsed = JSON.parse(responseContent);

    if (!parsed.pages || !Array.isArray(parsed.pages)) {
      throw new Error('Invalid response format');
    }

    // Validate and build proposals
    const proposals: PageEnrichmentProposal[] = pages.map((page) => {
      const generated = parsed.pages.find(
        (p: any) => p.slug === page.slug || p.page_id === page.id
      );

      if (!generated) {
        throw new Error(`Missing generated content for page: ${page.slug}`);
      }

      // Validate constraints
      validatePageEnrichment(generated, page.slug);

      // Count words
      const text = generated.html.replace(/<[^>]+>/g, '');
      const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;

      return {
        page_id: page.id,
        slug: page.slug,
        title: page.title,
        pageType: page.page_type,
        currentContentHtml: page.content_html,
        proposedContentHtml: generated.html,
        wordCount,
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
            page_id: p.page_id,
            slug: p.slug,
            wordCount: p.wordCount,
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
 * Build system prompt for page enrichment
 */
function buildPageEnrichmentSystemPrompt(site: any): string {
  return `You are a professional web content writer creating essential pages for ${site.site_type || 'editorial'} websites.

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON in this exact structure:
{
  "pages": [
    {
      "page_id": "uuid",
      "slug": "a-propos",
      "html": "<h2>Title</h2><p>Paragraph 1.</p><p>Paragraph 2.</p>"
    }
  ]
}

2. HTML constraints:
   - Use ONLY <h2> and <p> tags
   - 100-500 words per page (flexible based on page type)
   - 2-4 sections with <h2> headers
   - 2-3 paragraphs per section
   - Professional and clear tone
   - NO emojis
   - NO long dash (—), use regular dash (-) or comma
   - ${site.language === 'fr' ? 'Write in French' : 'Write in English'}

3. Content rules by page type:
   - "a-propos" (About): Explain site mission, team, editorial line
   - "contact": Contact info, contact form text (NO fake emails/phones - use placeholders)
   - "mentions-legales": Legal notices (editor, host, etc. - use [COMPANY_NAME] placeholders)
   - "politique-de-confidentialite": Privacy policy (GDPR-compliant, use placeholders)
   - "conditions-generales-utilisation": Terms of service (use placeholders)

4. Placeholders (for contact/legal pages):
   - Company name: [NOM_ENTREPRISE]
   - Email: contact@[DOMAINE]
   - Phone: [TELEPHONE]
   - Address: [ADRESSE]
   - SIRET: [SIRET]

${site.language === 'fr' ? 'IMPORTANT: Écrivez tout en français avec un ton professionnel.' : ''}
${site.description ? `\nSite context: ${site.description}` : ''}`;
}

/**
 * Build user prompt for page enrichment
 */
function buildPageEnrichmentUserPrompt(site: any, pages: any[]): string {
  const pageList = pages
    .map((p) => `- "${p.title}" (slug: ${p.slug}, type: ${p.page_type || 'unknown'})`)
    .join('\n');

  return `Generate professional content for these essential pages on ${site.name}:

${pageList}

Context:
- Site: ${site.name}
- Type: ${site.site_type || 'editorial'}
- Language: ${site.language}
- Country: ${site.country}
${site.description ? `- Description: ${site.description}` : ''}

For EACH page, generate appropriate HTML content:
- Use <h2> for section titles and <p> for paragraphs
- Write 100-500 words (adapt to page type)
- Be professional and clear
- Use placeholders for contact/legal info (NO fake data)

CRITICAL:
- NO emojis
- NO long dash (—)
- ${site.language === 'fr' ? 'Write in French' : 'Write in English'}
- Use placeholders like [NOM_ENTREPRISE], contact@[DOMAINE], [TELEPHONE]

Output the JSON now:`;
}

/**
 * Validate page enrichment output
 */
function validatePageEnrichment(generated: any, slug: string): void {
  if (!generated.html) {
    throw new Error('Missing HTML content');
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  
  if (emojiRegex.test(generated.html)) {
    throw new Error('Content contains emojis (forbidden)');
  }

  // Check for long dash
  if (generated.html.includes('—')) {
    throw new Error('Content contains long dash — (forbidden)');
  }

  // Check HTML format (should have <p> tags)
  if (!generated.html.includes('<p>')) {
    throw new Error('Page content must contain <p> tags');
  }

  // Check word count (very flexible: 50-600 words)
  const text = generated.html.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
  
  if (wordCount < 50 || wordCount > 600) {
    throw new Error(`Page word count out of range: ${wordCount} (50-600 expected)`);
  }

  // Warn if fake data detected (but don't fail - just log)
  if (generated.html.match(/\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2}/) || 
      generated.html.match(/\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/)) {
    console.warn(`⚠️ Possible fake phone number in ${slug}`);
  }
}

// ===================================
// APPLY ENRICHMENT
// ===================================

/**
 * Apply page enrichment proposals
 * Respects mode: fill_only_empty or overwrite
 */
export async function applyPageEnrichment(
  siteId: string,
  aiJobId: string,
  selectedProposals: PageEnrichmentProposal[],
  mode: 'fill_only_empty' | 'overwrite'
): Promise<{ appliedCount: number; skippedCount: number }> {
  const supabase = getSupabaseAdmin();

  let appliedCount = 0;
  let skippedCount = 0;
  const appliedIds: string[] = [];

  for (const proposal of selectedProposals) {
    // Update page content_html
    const shouldUpdate = mode === 'overwrite' || !proposal.currentContentHtml;

    if (shouldUpdate) {
      await supabase
        .from('content')
        .update({
          content_html: proposal.proposedContentHtml,
        })
        .eq('id', proposal.page_id);

      appliedIds.push(proposal.page_id);
      appliedCount++;
    } else {
      skippedCount++;
    }
  }

  // Update AI job with applied IDs
  const { data: currentJob } = await supabase
    .from('ai_job')
    .select('output_json')
    .eq('id', aiJobId)
    .single();

  await supabase
    .from('ai_job')
    .update({
      output_json: {
        ...currentJob?.output_json,
        appliedIds,
      },
    })
    .eq('id', aiJobId);

  return { appliedCount, skippedCount };
}
