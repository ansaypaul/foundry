import { getSupabaseAdmin } from '@/lib/db/client';
import { getOpenAIClient } from './openaiClient';
import { 
  BlueprintTemplateV1, 
  validateBlueprintTemplate,
  getBlueprintConstraints 
} from '@/lib/services/blueprint/blueprintTemplateSchema';

// ====================================
// Generate Blueprint Template with AI
// ====================================

export interface GenerateBlueprintResult {
  jobId: string;
  blueprintId: string;
  version: number;
  template: BlueprintTemplateV1;
}

/**
 * Generate a niche-adapted blueprint template using AI
 * Based on existing site configuration (no new tables)
 */
export async function generateBlueprintTemplateV1(
  siteId: string
): Promise<GenerateBlueprintResult> {
  const supabase = getSupabaseAdmin();
  const openai = getOpenAIClient();

  // 1. Load site from DB
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, description, language, country, site_type, ambition_level, automation_level')
    .eq('id', siteId)
    .single();

  if (siteError || !site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  // 2. Create AI job
  const { data: aiJob, error: aiJobError } = await supabase
    .from('ai_job')
    .insert({
      site_id: siteId,
      kind: 'generate_blueprint_template',
      status: 'running',
      started_at: new Date().toISOString(),
      model_used: 'gpt-4o',
      input_json: {
        siteName: site.name,
        siteDescription: site.description,
        language: site.language,
        country: site.country,
        siteType: site.site_type,
        ambitionLevel: site.ambition_level,
        automationLevel: site.automation_level,
      },
    })
    .select()
    .single();

  if (aiJobError || !aiJob) {
    console.error('AI Job creation error:', aiJobError);
    throw new Error(`Failed to create AI job: ${aiJobError?.message || 'Unknown error'}`);
  }

  try {
    // 3. Build prompts
    const systemPrompt = buildBlueprintSystemPrompt(site);
    const userPrompt = buildBlueprintUserPrompt(site);

    // 4. Call OpenAI (with retry on validation failure)
    let template: BlueprintTemplateV1 | null = null;
    let lastValidationErrors: string[] = [];
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // Add validation errors from previous attempt
      if (attempt > 1 && lastValidationErrors.length > 0) {
        messages.push({
          role: 'user',
          content: `CRITICAL: Previous output was INVALID. Validation errors:\n${lastValidationErrors.join('\n')}\n\nPlease fix these errors and output valid JSON again.`,
        });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse and validate
      let parsed: any;
      try {
        parsed = JSON.parse(responseContent);
      } catch (parseError) {
        lastValidationErrors = ['Failed to parse JSON response'];
        continue;
      }

      const validation = validateBlueprintTemplate(parsed);

      if (validation.valid && validation.template) {
        template = validation.template;
        break;
      } else {
        lastValidationErrors = validation.errors || ['Unknown validation error'];
      }
    }

    // If still no valid template after retries, fail
    if (!template) {
      throw new Error(`Validation failed after ${maxAttempts} attempts: ${lastValidationErrors.join(', ')}`);
    }

    // 5. Compute next version number
    const { data: existingBlueprints } = await supabase
      .from('site_blueprint')
      .select('version')
      .eq('site_id', siteId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingBlueprints?.[0]?.version || 0) + 1;

    // 6. Insert blueprint into site_blueprint
    const { data: blueprintRecord, error: blueprintError } = await supabase
      .from('site_blueprint')
      .insert({
        site_id: siteId,
        version: nextVersion,
        blueprint_json: template,
        notes: `AI-generated blueprint for ${site.name} (${site.site_type})`,
      })
      .select()
      .single();

    if (blueprintError || !blueprintRecord) {
      throw new Error(`Failed to save blueprint: ${blueprintError?.message || 'Unknown error'}`);
    }

    // 7. Update sites.active_blueprint_version
    await supabase
      .from('sites')
      .update({ active_blueprint_version: nextVersion })
      .eq('id', siteId);

    // 8. Update AI job to done
    await supabase
      .from('ai_job')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        output_json: {
          blueprintId: blueprintRecord.id,
          version: nextVersion,
          template,
          validationErrors: [],
        },
      })
      .eq('id', aiJob.id);

    return {
      jobId: aiJob.id,
      blueprintId: blueprintRecord.id,
      version: nextVersion,
      template,
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
 * Build system prompt for blueprint generation
 */
function buildBlueprintSystemPrompt(site: any): string {
  const constraints = getBlueprintConstraints(site.ambition_level || 'auto');

  return `You are an expert editorial strategist creating site structure blueprints.

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON matching this exact structure (no markdown, no commentary):
{
  "version": 1,
  "site": {
    "name": "${site.name}",
    "language": "${site.language}",
    "country": "${site.country}",
    "siteType": "${site.site_type}",
    "ambitionLevel": "${site.ambition_level}",
    "automationLevel": "${site.automation_level}",
    "nicheSummary": "1-2 sentence summary"
  },
  "taxonomy": {
    "categories": [
      {
        "name": "Category Name",
        "slug": "category-slug",
        "intent": "news|guides|recipes|reviews|culture|tips|shopping|other",
        "priority": 1|2|3
      }
    ]
  },
  "authors": [
    {
      "roleKey": "editorial_lead",
      "displayName": "Marie Dubois",
      "specialties": ["specialty1", "specialty2"],
      "isAi": true
    }
  ],
  "pages": [
    { "key": "about", "title": "À propos", "slug": "a-propos", "status": "draft" },
    { "key": "contact", "title": "Contact", "slug": "contact", "status": "draft" },
    { "key": "legal", "title": "Mentions légales", "slug": "mentions-legales", "status": "draft" },
    { "key": "privacy", "title": "Politique de confidentialité", "slug": "politique-de-confidentialite", "status": "draft" },
    { "key": "terms", "title": "Conditions générales", "slug": "conditions-generales-utilisation", "status": "draft" }
  ],
  "contentTypes": [
    {
      "key": "article_type_key",
      "label": "Article Type Label",
      "rules": {
        "minWords": 800,
        "h2Min": 3,
        "maxSingleItemLists": true,
        "allowHtmlTags": ["h2", "p", "ul", "li", "b", "i", "strong", "em"],
        "noEmojis": true,
        "noLongDash": true
      }
    }
  ],
  "seoDefaults": {
    "contentTitleTemplate": "{{title}} | ${site.name}",
    "termTitleTemplate": "{{termName}} | ${site.name}",
    "descriptionStrategy": "excerpt_or_first_paragraph_155",
    "ogTypeDefault": "article",
    "robotsDefault": { "index": true, "follow": true }
  }
}

2. STRICT CONSTRAINTS:
   - Categories: ${constraints.categories.min}-${constraints.categories.max} items
   - Authors: ${constraints.authors.min}-${constraints.authors.max} items
   - Content types: ${constraints.contentTypes.min}-${constraints.contentTypes.max} items
   - Pages: EXACTLY 5 (the ones shown above)

3. CONTENT RULES:
   - NO emojis anywhere
   - NO long dash (—), use regular dash (-) or comma
   - Slugs MUST be lowercase, kebab-case, ASCII only (no accents)
   - All category names MUST be specific to the niche
   - Avoid generic categories like "Accueil", "Blog", "Articles"
   - Priority: 1 = core topics, 2 = secondary, 3 = supplementary

3b. AUTHORS RULES (CRITICAL):
   - displayName MUST be a realistic PERSON NAME (first name + last name)
   - Generate random, realistic names matching the site's country/language
   - For French sites: "Marie Dubois", "Pierre Martin", "Sophie Laurent"
   - For English sites: "Sarah Johnson", "Michael Chen", "Emma Williams"
   - roleKey is technical (editorial_lead, senior_writer, etc.)
   - displayName is the PUBLIC author name shown to readers
   - Each author MUST have a UNIQUE, DIFFERENT name
   - DO NOT use role descriptions as names (NOT "Rédacteur en chef", NOT "Editor")

4. LANGUAGE:
   - Site language: ${site.language}
   - All names/titles MUST be in ${site.language === 'fr' ? 'French' : 'English'}

5. NICHE ADAPTATION:
   - Analyze site description to understand the niche
   - Create niche-specific categories, author roles, content types
   - For cuisine: "recettes", "techniques", "ingrédients", "cuisines-du-monde"
   - For tech: "tutoriels", "actualites", "tests", "comparatifs"
   - For gaming: "actualites", "tests", "guides", "esport"

Output the JSON now:`;
}

/**
 * Build user prompt for blueprint generation
 */
function buildBlueprintUserPrompt(site: any): string {
  return `Generate a complete editorial blueprint for this site:

Name: ${site.name}
Niche: ${site.description || 'General editorial site'}
Language: ${site.language}
Country: ${site.country}
Site Type: ${site.site_type}
Ambition: ${site.ambition_level}

Requirements:
1. Create categories that are SPECIFIC to this niche
2. Create authors with REALISTIC PERSON NAMES (not role descriptions):
   - displayName = real person name like "Marie Dubois" or "Pierre Laurent"
   - roleKey = technical role like "editorial_lead" or "senior_writer"
   - Each author needs a unique, realistic name matching ${site.country}
3. Create content types with appropriate word counts and rules
4. Ensure all slugs are clean (lowercase, kebab-case, ASCII)
5. NO generic categories
6. ALL content in ${site.language === 'fr' ? 'French' : 'English'}

CRITICAL:
- NO emojis
- NO long dash (—)
- Valid JSON only
- Follow the exact schema provided
- Author displayName MUST be realistic person names (first + last name)
- DO NOT use job titles or role descriptions as author names

Generate the blueprint now:`;
}
