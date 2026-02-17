import { getSupabaseAdmin } from '@/lib/db/client';
import { getContentTypeById } from '../contentTypes/contentTypeRegistry';
import { queryPerplexity, extractUrlsFromText } from './perplexityClient';
import { getExtractor } from './extractors';
import { runGating, buildRetryPrompt, GatingRules } from './gating/runGating';

// ====================================
// Research Orchestrator
// Universal research engine using Perplexity
// ====================================

export interface RunResearchInput {
  siteId: string;
  contentTypeId: string;
  topic: string;
  angle?: string | null;
}

export interface RunResearchOutput {
  researchPackId: string;
  status: 'completed' | 'failed';
  finalBrief: string | null;
  finalSources: string[];
  attemptsCount: number;
}

/**
 * Main orchestrator function
 * Runs research phase with dynamic config from content type
 */
export async function runResearch(
  input: RunResearchInput
): Promise<RunResearchOutput> {
  const { siteId, contentTypeId, topic, angle } = input;
  const supabase = getSupabaseAdmin();
  
  console.log('\n🔬 [RESEARCH ORCHESTRATOR] Starting research...');
  console.log(`   Topic: ${topic}`);
  console.log(`   Angle: ${angle || 'N/A'}`);
  
  // 1. Load content type config
  const contentType = await getContentTypeById(siteId, contentTypeId);
  
  if (!contentType) {
    throw new Error(`Content type not found: ${contentTypeId}`);
  }
  
  console.log(`   Content Type: ${contentType.label} (${contentType.key})`);
  
  // Get research config
  const researchConfig = await getResearchConfig(contentTypeId);
  
  if (!researchConfig.research_prompt_template) {
    throw new Error(`Content type ${contentType.key} has no research_prompt_template configured`);
  }
  
  console.log(`   Extractor: ${researchConfig.research_extractor_key}`);
  console.log(`   Max Attempts: ${researchConfig.research_max_attempts}`);
  
  // 2. Create research pack
  const { data: researchPack, error: packError } = await supabase
    .from('research_packs')
    .insert({
      site_id: siteId,
      content_type_id: contentTypeId,
      topic,
      angle,
      status: 'partial',
      attempts_count: 0,
    })
    .select()
    .single();
  
  if (packError || !researchPack) {
    throw new Error('Failed to create research pack');
  }
  
  console.log(`   ✓ Research Pack created: ${researchPack.id}`);
  
  // 3. Get extractor
  const extractor = getExtractor(researchConfig.research_extractor_key);
  
  if (!extractor) {
    throw new Error(`Extractor not found: ${researchConfig.research_extractor_key}`);
  }
  
  // 4. Run research attempts
  let lastPrompt = buildPrompt(researchConfig.research_prompt_template, topic, angle);
  let passedAttempt: any = null;
  
  for (let attempt = 1; attempt <= researchConfig.research_max_attempts; attempt++) {
    console.log(`\n   📡 Attempt ${attempt}/${researchConfig.research_max_attempts}`);
    
    const startTime = Date.now();
    
    try {
      // Call Perplexity
      const perplexityResult = await queryPerplexity({
        systemPrompt: 'You are a research assistant providing factual, well-sourced information.',
        userPrompt: lastPrompt,
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✓ Perplexity responded (${duration}ms, ${perplexityResult.tokensUsed} tokens)`);
      console.log(`   ✓ Citations: ${perplexityResult.citations.length}`);
      
      // Extract URLs from response
      const extractedUrls = [
        ...perplexityResult.citations,
        ...extractUrlsFromText(perplexityResult.content),
      ];
      const uniqueUrls = [...new Set(extractedUrls)];
      
      // Parse with extractor
      const parsedPayload = extractor.extract(perplexityResult.content, uniqueUrls);
      
      console.log(`   ✓ Extracted: ${parsedPayload.sections} sections, ${parsedPayload.items.length} items, ${parsedPayload.allSources.length} sources`);
      
      // Run gating
      const gatingResult = runGating(parsedPayload, researchConfig.research_gating_rules);
      
      console.log(`   ${gatingResult.pass ? '✅' : '❌'} Gating: ${gatingResult.pass ? 'PASS' : 'FAIL'}`);
      
      if (!gatingResult.pass) {
        console.log(`   Reasons: ${gatingResult.reasons.join('; ')}`);
      }
      
      // Save attempt
      await supabase.from('research_attempts').insert({
        research_pack_id: researchPack.id,
        attempt_no: attempt,
        prompt: lastPrompt,
        raw_response: perplexityResult.content,
        extracted_sources: uniqueUrls,
        parsed_payload: parsedPayload,
        gating_report: gatingResult,
        passed_gating: gatingResult.pass,
        model_used: perplexityResult.model,
        tokens_used: perplexityResult.tokensUsed,
        duration_ms: duration,
      });
      
      // Check if passed
      if (gatingResult.pass) {
        passedAttempt = {
          content: perplexityResult.content,
          sources: uniqueUrls,
        };
        break;
      }
      
      // Build retry prompt
      if (attempt < researchConfig.research_max_attempts) {
        lastPrompt = buildRetryPrompt(
          lastPrompt,
          gatingResult,
          researchConfig.research_gating_rules
        );
        console.log(`   🔄 Retry prompt built with improvements`);
      }
      
    } catch (error) {
      console.error(`   ❌ Attempt ${attempt} error:`, error);
      
      // Save failed attempt
      await supabase.from('research_attempts').insert({
        research_pack_id: researchPack.id,
        attempt_no: attempt,
        prompt: lastPrompt,
        raw_response: error instanceof Error ? error.message : 'Unknown error',
        gating_report: {
          pass: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        passed_gating: false,
      });
    }
  }
  
  // 5. Update research pack with final result
  const finalStatus = passedAttempt ? 'completed' : 'failed';
  
  await supabase
    .from('research_packs')
    .update({
      status: finalStatus,
      attempts_count: researchConfig.research_max_attempts,
      final_brief_markdown: passedAttempt?.content || null,
      final_sources: passedAttempt?.sources || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', researchPack.id);
  
  console.log(`\n   ${passedAttempt ? '✅' : '❌'} Research ${finalStatus.toUpperCase()}`);
  console.log(`========================================\n`);
  
  if (!passedAttempt) {
    throw new Error('Research failed after all attempts');
  }
  
  return {
    researchPackId: researchPack.id,
    status: 'completed',
    finalBrief: passedAttempt.content,
    finalSources: passedAttempt.sources,
    attemptsCount: researchConfig.research_max_attempts,
  };
}

/**
 * Load research config from content type
 */
async function getResearchConfig(contentTypeId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('editorial_content_types')
    .select('research_prompt_template, research_extractor_key, research_gating_rules, research_max_attempts')
    .eq('id', contentTypeId)
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to load research config for content type: ${contentTypeId}`);
  }
  
  return {
    research_prompt_template: data.research_prompt_template || '',
    research_extractor_key: data.research_extractor_key || 'article_md',
    research_gating_rules: (data.research_gating_rules || {}) as GatingRules,
    research_max_attempts: data.research_max_attempts || 3,
  };
}

/**
 * Build prompt from template with placeholders
 */
function buildPrompt(template: string, topic: string, angle?: string | null): string {
  let prompt = template;
  
  // Replace placeholders
  prompt = prompt.replace(/\{\{topic\}\}/g, topic);
  prompt = prompt.replace(/\{\{angle\}\}/g, angle || '');
  
  // Clean up double spaces if angle was empty
  prompt = prompt.replace(/\s{2,}/g, ' ').trim();
  
  return prompt;
}
