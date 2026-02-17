// ====================================
// Perplexity API Client
// Generic client for research queries
// ====================================

interface PerplexityMessage {
  role: 'system' | 'user';
  content: string;
}

interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  return_citations?: boolean;
  return_images?: boolean;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

/**
 * Check if Perplexity is configured
 */
export function isPerplexityConfigured(): boolean {
  return !!process.env.PERPLEXITY_API_KEY;
}

/**
 * Get Perplexity API client
 */
export function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured in environment variables');
  }
  
  return {
    /**
     * Call Perplexity Chat API
     */
    async chat(request: PerplexityRequest): Promise<PerplexityResponse> {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${error}`);
      }
      
      const data = await response.json();
      return data as PerplexityResponse;
    },
  };
}

/**
 * Simplified research query function
 * 
 * Available models (as of Feb 2024):
 * - sonar-pro (recommended for research)
 * - sonar (faster, less accurate)
 * - sonar-reasoning (best for complex queries)
 */
export async function queryPerplexity(args: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}): Promise<{
  content: string;
  citations: string[];
  tokensUsed: number;
  model: string;
}> {
  const client = getPerplexityClient();
  
  const response = await client.chat({
    model: args.model || 'sonar-pro',
    messages: [
      { role: 'system', content: args.systemPrompt },
      { role: 'user', content: args.userPrompt },
    ],
    temperature: args.temperature ?? 0.2, // Low temp for factual research
    max_tokens: 4000,
    return_citations: true,
    return_images: false,
  });
  
  const content = response.choices[0]?.message?.content || '';
  const citations = response.citations || [];
  const tokensUsed = response.usage?.total_tokens || 0;
  
  return {
    content,
    citations,
    tokensUsed,
    model: response.model,
  };
}

/**
 * Extract URLs from markdown/text
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\])<]+/g;
  const matches = text.match(urlRegex) || [];
  
  // Deduplicate and clean
  const urls = [...new Set(matches)].map(url => {
    // Remove trailing punctuation
    return url.replace(/[.,;:!?]+$/, '');
  });
  
  return urls;
}

/**
 * Check if URL is from official/trusted source
 */
export function isOfficialSource(url: string): boolean {
  const officialPatterns = [
    /\.(gov|edu)$/i,
    /wikipedia\.org/i,
    /official/i,
    /press\..*\.com/i,
    /newsroom\./i,
    /blog\..*\.com/i, // Official blogs
  ];
  
  return officialPatterns.some(pattern => pattern.test(url));
}
