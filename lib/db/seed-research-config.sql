-- ====================================
-- SEED: Research Configuration for Content Types
-- Adds Perplexity research prompts and gating rules
-- ====================================

-- ====================================
-- 1. TOP 10
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide a comprehensive brief for a Top 10 article about: {{topic}}{{angle}}

CRITICAL FORMAT REQUIREMENTS:
- You MUST provide EXACTLY 10 items in a numbered list format
- Use this exact format for each item:

1. **[Item Name]** - Brief description
2. **[Item Name]** - Brief description
... (continue to 10)

For each item, include:
- Key facts and specifications
- Release dates or availability
- Pricing if applicable
- Why it made the list

Include at least 3 reliable sources.

Format the response in clear markdown with the numbered list prominently featured.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 3,
    "require_official_source": false,
    "min_items": 8,
    "min_content_length": 800
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'top10';

-- ====================================
-- 2. NEWS
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide factual information for a news article about: {{topic}}{{angle}}

Please provide:
- Confirmed facts and official statements
- Exact dates and timeline
- Official sources (press releases, government sites, official announcements)
- Context and background
- Impact analysis

Format the response in clear markdown.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 3,
    "require_official_source": true,
    "must_have_date": true,
    "min_content_length": 400
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'news';

-- ====================================
-- 3. GUIDE
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide comprehensive information for a complete guide about: {{topic}}{{angle}}

Please provide:
- Step-by-step procedures
- Best practices from experts
- Common pitfalls and how to avoid them
- Tools and resources needed
- Examples and case studies
- Official documentation links

Format the response in clear markdown with sections.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 4,
    "min_sections": 5,
    "min_content_length": 1200
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'guide';

-- ====================================
-- 4. HOW-TO
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide step-by-step information for a tutorial about: {{topic}}{{angle}}

Please provide:
- Clear sequential steps with details
- Prerequisites and requirements
- Tips and warnings for each step
- Expected results
- Troubleshooting common issues
- Reliable sources

Format the response in clear markdown with numbered steps.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 3,
    "min_sections": 4,
    "min_content_length": 800
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'howto';

-- ====================================
-- 5. REVIEW
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide detailed information for a review of: {{topic}}{{angle}}

Please provide:
- Technical specifications
- Key features and capabilities
- Pricing information (MSRP, current price, deals)
- Expert opinions and existing reviews
- Pros and cons analysis
- Comparison with competitors
- Official product page and documentation

Format the response in clear markdown with sections.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 4,
    "require_official_source": true,
    "must_have_pricing": true,
    "min_content_length": 1000
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'review';

-- ====================================
-- 6. COMPARISON
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide comparative information for: {{topic}}{{angle}}

Please provide:
- Detailed comparison of at least 3 options/products
- Key specifications for each option
- Pricing comparison
- Pros and cons for each
- Expert recommendations
- Official sources for each option

Format the response in clear markdown with comparison sections.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 5,
    "require_official_source": true,
    "must_have_pricing": true,
    "min_items": 3,
    "min_content_length": 1200
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'comparison';

-- ====================================
-- 7. INTERVIEW
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research background information for an interview about: {{topic}}{{angle}}

Please provide:
- Background on the subject/person
- Key topics to cover
- Recent news and context
- Important quotes and statements
- Career highlights or product history
- Reliable biographical/factual sources

Format the response in clear markdown.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 3,
    "min_sections": 3,
    "min_content_length": 800
  }'::jsonb,
  
  research_max_attempts = 2,
  research_required = false,
  updated_at = NOW()
WHERE key = 'interview';

-- ====================================
-- 8. EXPLAINER
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research and provide comprehensive explanatory information about: {{topic}}{{angle}}

Please provide:
- Clear explanation of the concept/phenomenon
- Historical context and evolution
- Key facts and statistics
- Expert perspectives
- Real-world examples and applications
- Current state and future implications
- Authoritative sources

Format the response in clear markdown with sections.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 4,
    "must_have_stats": true,
    "min_sections": 4,
    "min_content_length": 1000
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'explainer';

-- ====================================
-- 9. OPINION
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research background and context for an opinion piece about: {{topic}}{{angle}}

Please provide:
- Factual background and context
- Different perspectives on the issue
- Key arguments from various viewpoints
- Recent developments and trends
- Statistics and evidence to support analysis
- Relevant sources

Format the response in clear markdown.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 3,
    "min_sections": 2,
    "min_content_length": 600
  }'::jsonb,
  
  research_max_attempts = 2,
  research_required = false,
  updated_at = NOW()
WHERE key = 'opinion';

-- ====================================
-- 10. EVERGREEN
-- ====================================
UPDATE editorial_content_types
SET 
  research_prompt_template = 'Research comprehensive, timeless information about: {{topic}}{{angle}}

Please provide:
- Fundamental concepts and principles
- Detailed explanations
- Expert insights and best practices
- Real-world examples
- Common misconceptions
- Actionable advice
- Authoritative sources (books, research papers, expert sites)

Format the response in clear markdown with sections.',
  
  research_extractor_key = 'article_md',
  
  research_gating_rules = '{
    "min_sources": 4,
    "min_sections": 5,
    "min_content_length": 1200
  }'::jsonb,
  
  research_max_attempts = 3,
  research_required = true,
  updated_at = NOW()
WHERE key = 'evergreen';

-- ====================================
-- Verification
-- ====================================

SELECT 
  key,
  label,
  research_required,
  research_max_attempts,
  research_extractor_key,
  research_gating_rules->>'min_sources' as min_sources,
  research_gating_rules->>'min_sections' as min_sections,
  LENGTH(research_prompt_template) as prompt_length
FROM editorial_content_types
WHERE research_prompt_template IS NOT NULL
ORDER BY key;

-- ====================================
-- Notes
-- ====================================
-- Safe to run multiple times (UPDATE with WHERE)
-- All content types now have research configuration
-- Can be disabled per type by setting research_required = false
