-- ====================================
-- SEED: Editorial Content Types
-- Core content types with templates, prompts, and validation rules
-- ====================================

-- Insert core content types
-- Each type includes:
-- - template_schema: structural definition
-- - prompts: AI instructions (system, style, plan, format)
-- - validator_profile: validation rules
-- - allowed_html_tags: permitted HTML
-- - forbidden_patterns: prohibited strings

-- ====================================
-- 1. TOP 10 / LISTICLE
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'top10',
  'Top 10',
  'Article de type liste/classement avec exactement 10 items',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "items", "type": "items", "tag": "h2", "count_exact": 10},
      {"id": "item_body", "type": "item_body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 1,
      "no_visible_conclusion": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a Top 10 article. Your task is to create a ranking of exactly 10 items, each with its own H2 section. Structure: introduction (2+ paragraphs), then 10 H2 sections (one per item), each with at least 2 paragraphs of detailed explanation. Do not add a conclusion section. The ranking should be clear and each item should be well-justified.',
  -- style_prompt
  'Write in an engaging, informative tone. Be authoritative but accessible. Use clear, direct language. Provide specific details and examples for each item. Maintain consistent quality across all 10 items.',
  -- plan_prompt
  'Start with a compelling introduction that explains what this Top 10 is about and why it matters. Then present exactly 10 items, each as an H2 section. Structure each item with: title (H2), description (2+ paragraphs with details, context, and justification). Do NOT add a conclusion section.',
  -- format_prompt
  'Use only these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 1 list (<ul>) in the entire article. No long dashes (—). No conclusion section with titles like "Conclusion" or "En résumé".',
  -- validator_profile
  '{
    "min_words": 1200,
    "h2_count_exact": 10,
    "min_paragraphs_per_h2": 2,
    "max_lists": 1,
    "forbidden_substrings": ["—", "Conclusion", "En conclusion", "Pour conclure", "En résumé"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "En conclusion", "Pour conclure", "En résumé"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 2. NEWS / ACTUALITÉ
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'news',
  'Actualité',
  'Article d''actualité court et factuel',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 1},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 2, "count_max": 4},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 1}
    ],
    "rules": {
      "max_lists": 1,
      "concise": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a news article. Your task is to report facts concisely and accurately. Structure: brief introduction, 2-4 H2 sections developing key aspects, 1-2 paragraphs per section. Be factual, neutral, and direct.',
  -- style_prompt
  'Write in a factual, journalistic tone. Be concise and direct. Focus on who, what, when, where, why. Avoid opinions. Use active voice. Present information clearly and objectively.',
  -- plan_prompt
  'Start with a brief introduction covering the main news. Then develop 2-4 key aspects in separate H2 sections. Each section should have 1-2 paragraphs. Keep it concise and informative.',
  -- format_prompt
  'Use only these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 1 list. No long dashes (—). Keep sentences short and clear.',
  -- validator_profile
  '{
    "min_words": 400,
    "max_words": 800,
    "h2_count_min": 2,
    "h2_count_max": 4,
    "min_paragraphs_per_h2": 1,
    "max_lists": 1,
    "forbidden_substrings": ["—"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 3. GUIDE / EVERGREEN GUIDE
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'guide',
  'Guide',
  'Guide pratique complet et détaillé (evergreen)',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 4, "count_max": 8},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 2,
      "depth_required": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a comprehensive guide. Your task is to create in-depth, practical content that helps readers understand and accomplish something. Structure: thorough introduction, 4-8 H2 sections, each with 2+ paragraphs. Provide context, details, examples, and actionable advice.',
  -- style_prompt
  'Write in a helpful, authoritative tone. Be thorough but accessible. Explain concepts clearly. Provide specific examples. Anticipate reader questions. Use a teaching approach.',
  -- plan_prompt
  'Start with a solid introduction explaining what this guide covers and why it matters. Then develop 4-8 major sections (H2), each covering a key aspect. Each section should have at least 2 substantial paragraphs with details, context, and examples.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 2 lists total. No long dashes (—). Write detailed, well-developed paragraphs.',
  -- validator_profile
  '{
    "min_words": 1500,
    "h2_count_min": 4,
    "h2_count_max": 8,
    "min_paragraphs_per_h2": 2,
    "max_lists": 2,
    "forbidden_substrings": ["—", "En conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "En conclusion", "Pour conclure"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 4. HOW-TO / TUTORIAL
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'howto',
  'How-To / Tutoriel',
  'Tutoriel pratique avec étapes procédurales',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 1},
      {"id": "steps", "type": "steps", "tag": "h2", "count_min": 3, "count_max": 6},
      {"id": "step_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 1,
      "procedural": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a how-to tutorial. Your task is to guide readers through a process step-by-step. Structure: brief introduction, 3-6 H2 sections (steps/phases), each with 2+ paragraphs explaining how to do it. Be clear, specific, and actionable.',
  -- style_prompt
  'Write in a clear, instructional tone. Use direct language. Be specific about actions. Provide details and tips. Anticipate difficulties. Use second person ("you") when appropriate.',
  -- plan_prompt
  'Start with a brief introduction explaining what will be accomplished. Then present 3-6 steps or phases (H2), each with at least 2 paragraphs explaining clearly how to proceed. Focus on actionable instructions.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 1 list. No long dashes (—). Write clear, actionable instructions.',
  -- validator_profile
  '{
    "min_words": 1000,
    "h2_count_min": 3,
    "h2_count_max": 6,
    "min_paragraphs_per_h2": 2,
    "max_lists": 1,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "En conclusion"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 5. REVIEW / TEST
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'review',
  'Test / Critique',
  'Test ou critique détaillée d''un produit, service ou oeuvre',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 4, "count_max": 6},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 2,
      "verdict_implicit": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a review/test. Your task is to provide a detailed, balanced evaluation. Structure: introduction with context, 4-6 H2 sections covering key aspects, each with 2+ paragraphs. Be thorough, fair, and specific. Include both positives and negatives.',
  -- style_prompt
  'Write in an analytical, balanced tone. Be critical but fair. Provide specific observations. Support opinions with facts. Be detailed about what works and what doesn''t. Maintain objectivity.',
  -- plan_prompt
  'Start with an introduction presenting what is being reviewed and context. Then develop 4-6 major aspects (H2): features, performance, design, value, etc. Each section should have at least 2 paragraphs with specific observations and analysis.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 2 lists. No long dashes (—). No explicit "Conclusion" section - integrate verdict naturally.',
  -- validator_profile
  '{
    "min_words": 1200,
    "h2_count_min": 4,
    "h2_count_max": 6,
    "min_paragraphs_per_h2": 2,
    "max_lists": 2,
    "forbidden_substrings": ["—", "Conclusion", "Notre verdict"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "Notre verdict", "En résumé"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 6. COMPARISON / COMPARATIF
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'comparison',
  'Comparatif',
  'Comparaison détaillée de produits, services ou options',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 5, "count_max": 7},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 2,
      "comparative": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a comparison article. Your task is to compare options systematically across multiple criteria. Structure: introduction, 5-7 H2 sections (criteria or items), each with 2+ paragraphs. Be objective, specific, and help readers make informed decisions.',
  -- style_prompt
  'Write in an objective, analytical tone. Be systematic in comparisons. Provide specific data and facts. Highlight differences clearly. Help readers understand trade-offs. Be fair to all options.',
  -- plan_prompt
  'Start with an introduction explaining what is being compared and why. Then develop 5-7 comparison criteria or sections (H2), each with at least 2 paragraphs analyzing differences, strengths, and weaknesses.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 2 lists. No long dashes (—). Present comparisons clearly and systematically.',
  -- validator_profile
  '{
    "min_words": 1400,
    "h2_count_min": 5,
    "h2_count_max": 7,
    "min_paragraphs_per_h2": 2,
    "max_lists": 2,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "Notre choix final"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 7. INTERVIEW / PORTRAIT
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'interview',
  'Interview / Portrait',
  'Interview ou portrait d''une personne',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 3, "count_max": 6},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 1,
      "narrative": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing an interview or portrait. Your task is to present a person through their words and experiences. Structure: introduction with context, 3-6 H2 sections covering themes or topics, each with 2+ paragraphs. Be engaging and respectful.',
  -- style_prompt
  'Write in an engaging, narrative tone. Balance direct quotes with context. Show personality. Be respectful and insightful. Create a compelling portrait of the person.',
  -- plan_prompt
  'Start with an introduction presenting the person and context. Then develop 3-6 thematic sections (H2) covering key aspects of their work, vision, or experience. Each section should have at least 2 paragraphs.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 1 list. No long dashes (—). Use quotes naturally within text.',
  -- validator_profile
  '{
    "min_words": 1000,
    "h2_count_min": 3,
    "h2_count_max": 6,
    "min_paragraphs_per_h2": 2,
    "max_lists": 1,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 8. EXPLAINER / DÉCRYPTAGE
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'explainer',
  'Décryptage / Explainer',
  'Article explicatif qui décrypte un sujet complexe',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 4, "count_max": 6},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 2,
      "educational": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing an explainer article. Your task is to make a complex topic understandable. Structure: clear introduction, 4-6 H2 sections building understanding progressively, each with 2+ paragraphs. Break down complexity. Provide context. Use examples.',
  -- style_prompt
  'Write in a clear, educational tone. Make complex topics accessible. Use analogies and examples. Build understanding progressively. Anticipate confusion. Be thorough but not overwhelming.',
  -- plan_prompt
  'Start with an introduction that frames the topic and why it matters. Then develop 4-6 sections (H2) that progressively explain the topic. Each section should have at least 2 paragraphs with clear explanations and examples.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 2 lists. No long dashes (—). Focus on clarity.',
  -- validator_profile
  '{
    "min_words": 1300,
    "h2_count_min": 4,
    "h2_count_max": 6,
    "min_paragraphs_per_h2": 2,
    "max_lists": 2,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "En résumé"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 9. OPINION / EDITORIAL
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'opinion',
  'Opinion / Éditorial',
  'Article d''opinion ou éditorial argumenté',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 2},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 3, "count_max": 5},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 2}
    ],
    "rules": {
      "max_lists": 1,
      "argumentative": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing an opinion piece. Your task is to present and defend a viewpoint with arguments. Structure: introduction with thesis, 3-5 H2 sections developing arguments, each with 2+ paragraphs. Be persuasive but fair. Support opinions with reasoning.',
  -- style_prompt
  'Write in a confident, persuasive tone. Present clear arguments. Support claims with reasoning and evidence. Be engaging. Show respect for other viewpoints while defending yours.',
  -- plan_prompt
  'Start with an introduction presenting your thesis. Then develop 3-5 arguments (H2), each with at least 2 paragraphs. Build your case systematically. Address counterarguments if relevant.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 1 list. No long dashes (—). Write persuasively.',
  -- validator_profile
  '{
    "min_words": 900,
    "h2_count_min": 3,
    "h2_count_max": 5,
    "min_paragraphs_per_h2": 2,
    "max_lists": 1,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "En conclusion"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ====================================
-- 10. EVERGREEN / ARTICLE DE FOND
-- ====================================
INSERT INTO editorial_content_types (
  key, label, description,
  is_system, is_active,
  template_schema,
  system_prompt,
  style_prompt,
  plan_prompt,
  format_prompt,
  validator_profile,
  allowed_html_tags,
  forbidden_patterns
) VALUES (
  'evergreen',
  'Article de fond',
  'Article evergreen long et complet sur un sujet intemporel',
  true,
  true,
  -- template_schema
  '{
    "format": "html",
    "blocks": [
      {"id": "intro", "type": "intro", "tag": "p", "min_paragraphs": 3},
      {"id": "sections", "type": "sections", "tag": "h2", "count_min": 6, "count_max": 10},
      {"id": "section_body", "type": "body", "tag": "p", "min_paragraphs_per_h2": 3}
    ],
    "rules": {
      "max_lists": 3,
      "comprehensive": true
    }
  }'::jsonb,
  -- system_prompt
  'You are writing a comprehensive evergreen article. Your task is to create the definitive resource on this topic. Structure: substantial introduction, 6-10 H2 sections, each with 3+ paragraphs. Be thorough, authoritative, and timeless. Provide depth and breadth.',
  -- style_prompt
  'Write in an authoritative, comprehensive tone. Be thorough and detailed. Provide context, history, and depth. Use examples. Anticipate all reader questions. Create a reference resource.',
  -- plan_prompt
  'Start with a substantial introduction (3+ paragraphs) establishing the topic comprehensively. Then develop 6-10 major sections (H2) covering all key aspects. Each section should have at least 3 well-developed paragraphs.',
  -- format_prompt
  'Use these HTML tags: h2, p, b, i, strong, em, ul, li. Maximum 3 lists. No long dashes (—). Write comprehensive, detailed content.',
  -- validator_profile
  '{
    "min_words": 2000,
    "h2_count_min": 6,
    "h2_count_max": 10,
    "min_paragraphs_per_h2": 3,
    "max_lists": 3,
    "forbidden_substrings": ["—", "Conclusion"]
  }'::jsonb,
  -- allowed_html_tags
  '["h2", "p", "b", "i", "strong", "em", "ul", "li"]'::jsonb,
  -- forbidden_patterns
  '["—", "Conclusion", "En conclusion"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Successfully seeded % editorial content types', (SELECT COUNT(*) FROM editorial_content_types WHERE is_system = true);
END $$;
