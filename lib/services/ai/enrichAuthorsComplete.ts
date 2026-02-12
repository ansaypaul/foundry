import { getSupabaseAdmin } from '@/lib/db/client';
import { getOpenAIClient } from './openaiClient';

// ===================================
// TYPES
// ===================================

export interface AuthorEnrichmentInput {
  siteId: string;
  authorIds?: string[]; // If empty, process all
  mode: 'fill_only_empty' | 'overwrite';
}

export interface AuthorEnrichmentProposal {
  author_id: string;
  displayName: string;
  roleKey: string | null;
  specialties: string[];
  currentBio: string | null;
  proposedTagline: string;
  proposedBioHtml: string;
}

export interface AuthorEnrichmentResult {
  proposals: AuthorEnrichmentProposal[];
  aiJobId: string;
}

// ===================================
// BUILD ENRICHMENT PROPOSALS
// ===================================

/**
 * Generate AI-powered bios for authors
 * Returns proposals that can be previewed before applying
 */
export async function buildAuthorEnrichmentProposals(
  input: AuthorEnrichmentInput
): Promise<AuthorEnrichmentResult> {
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

  // Load authors
  let authorsQuery = supabase
    .from('authors')
    .select('id, display_name, bio, role_key, specialties, status')
    .eq('site_id', input.siteId)
    .eq('status', 'active');

  if (input.authorIds && input.authorIds.length > 0) {
    authorsQuery = authorsQuery.in('id', input.authorIds);
  }

  const { data: authors } = await authorsQuery;

  if (!authors || authors.length === 0) {
    throw new Error('No authors found');
  }

  // Create AI job
  const { data: aiJob, error: aiJobError } = await supabase
    .from('ai_job')
    .insert({
      site_id: input.siteId,
      kind: 'enrich_authors',
      status: 'running',
      started_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini',
      input_json: {
        siteId: input.siteId,
        siteName: site.name,
        siteDescription: site.description,
        siteType: site.site_type,
        language: site.language,
        authorCount: authors.length,
        authorRoles: authors.map((a) => a.role_key || 'writer'),
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
    const systemPrompt = buildAuthorEnrichmentSystemPrompt(site);

    // Build user prompt
    const userPrompt = buildAuthorEnrichmentUserPrompt(site, authors);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse response
    const parsed = JSON.parse(responseContent);

    if (!parsed.authors || !Array.isArray(parsed.authors)) {
      throw new Error('Invalid response format');
    }

    // Validate and build proposals
    const proposals: AuthorEnrichmentProposal[] = authors.map((author) => {
      const generated = parsed.authors.find(
        (a: any) => a.author_id === author.id || a.displayName === author.display_name
      );

      if (!generated) {
        throw new Error(`Missing generated content for author: ${author.display_name}`);
      }

      // Validate constraints
      validateAuthorEnrichment(generated);

      return {
        author_id: author.id,
        displayName: author.display_name,
        roleKey: author.role_key,
        specialties: Array.isArray(author.specialties) ? author.specialties : [],
        currentBio: author.bio,
        proposedTagline: generated.tagline,
        proposedBioHtml: generated.bio_html,
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
            author_id: p.author_id,
            displayName: p.displayName,
            tagline: p.proposedTagline,
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
 * Build system prompt for author enrichment
 */
function buildAuthorEnrichmentSystemPrompt(site: any): string {
  return `You are a professional content writer creating author biographies for ${site.site_type || 'editorial'} websites.

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON in this exact structure:
{
  "authors": [
    {
      "author_id": "uuid",
      "displayName": "Author Name",
      "roleKey": "role_key",
      "tagline": "60-90 chars short sentence",
      "bio_html": "<p>Paragraph 1.</p><p>Paragraph 2.</p><p>Paragraph 3.</p>"
    }
  ]
}

2. TAGLINE constraints:
   - 50-110 characters (flexible, aim for 70-90)
   - Single sentence describing expertise/role
   - Professional and credible
   - NO emojis
   - NO long dash (—)
   - ${site.language === 'fr' ? 'Write in French' : 'Write in English'}

3. BIO HTML constraints:
   - 60-250 words total (flexible range, quality over quantity)
   - HTML format with <p> tags ONLY
   - 2-3 paragraphs
   - Credible, editorial, specialized tone
   - Reflect role and specialties
   - NO emojis
   - NO long dash (—)
   - NO real social links or real identities (keep generic)
   - NO grandiose claims
   - Be specific about expertise and contributions
   - IMPORTANT: Write naturally and concisely. Don't pad unnecessarily.

4. Tone:
   - Professional and credible
   - Not overly promotional
   - Focus on expertise and editorial contributions
   - Avoid "passionné", "dédié" clichés

${site.language === 'fr' ? 'IMPORTANT: Écrivez tout en français.' : ''}
${site.description ? `\nSite context: ${site.description}` : ''}`;
}

/**
 * Build user prompt for author enrichment
 */
function buildAuthorEnrichmentUserPrompt(site: any, authors: any[]): string {
  const authorList = authors
    .map((a) => {
      const specialties = Array.isArray(a.specialties) && a.specialties.length > 0
        ? ` (spécialités: ${a.specialties.join(', ')})`
        : '';
      return `- "${a.display_name}" (role: ${a.role_key || 'writer'}${specialties})`;
    })
    .join('\n');

  return `Generate professional author biographies for ${site.name}:

${authorList}

Context:
- Site: ${site.name}
- Type: ${site.site_type || 'editorial'}
- Language: ${site.language}
${site.description ? `- Description: ${site.description}` : ''}

For EACH author, write:

1. **tagline** (50-110 chars, aim 70-90):
   - ONE sentence describing their expertise
   - Professional and credible tone
   - Reflect their role and specialties

2. **bio_html** (60-250 words):
   - 2-3 paragraphs in HTML <p> tags
   - Describe their expertise and contributions
   - Professional editorial tone
   - Credible, not grandiose
   - Generic (no real social links or identities)
   - Write naturally and concisely

CRITICAL RULES:
- NO emojis anywhere
- NO long dash (—), use regular dash (-) or comma
- ${site.language === 'fr' ? 'Write everything in French' : 'Write everything in English'}
- Be credible and specific, avoid clichés like "passionné" or "dédié"

Output the JSON now:`;
}

/**
 * Validate author enrichment output
 * Relaxed constraints for better success rate
 */
function validateAuthorEnrichment(generated: any): void {
  // Check tagline length (relaxed: 40-120 chars)
  if (!generated.tagline || generated.tagline.length < 40 || generated.tagline.length > 120) {
    throw new Error(
      `Tagline length out of range: ${generated.tagline?.length || 0} chars (40-120 expected)`
    );
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  
  if (emojiRegex.test(generated.tagline) || emojiRegex.test(generated.bio_html)) {
    throw new Error('Content contains emojis (forbidden)');
  }

  // Check for long dash
  if (generated.tagline.includes('—') || generated.bio_html.includes('—')) {
    throw new Error('Content contains long dash — (forbidden)');
  }

  // Check HTML format
  if (!generated.bio_html.includes('<p>')) {
    throw new Error('Bio must contain <p> tags');
  }

  // Check word count (relaxed: 50-300 words)
  const text = generated.bio_html.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
  
  if (wordCount < 50 || wordCount > 300) {
    throw new Error(`Bio word count out of range: ${wordCount} (50-300 expected)`);
  }
}

// ===================================
// APPLY ENRICHMENT
// ===================================

/**
 * Apply author enrichment proposals
 * Respects mode: fill_only_empty or overwrite
 */
export async function applyAuthorEnrichment(
  siteId: string,
  aiJobId: string,
  selectedProposals: AuthorEnrichmentProposal[],
  mode: 'fill_only_empty' | 'overwrite'
): Promise<{ appliedCount: number; skippedCount: number }> {
  const supabase = getSupabaseAdmin();

  let appliedCount = 0;
  let skippedCount = 0;
  const appliedIds: string[] = [];

  for (const proposal of selectedProposals) {
    // Update author bio
    const shouldUpdateBio = mode === 'overwrite' || !proposal.currentBio;

    if (shouldUpdateBio) {
      await supabase
        .from('authors')
        .update({
          bio: proposal.proposedBioHtml,
        })
        .eq('id', proposal.author_id);

      appliedIds.push(proposal.author_id);
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
