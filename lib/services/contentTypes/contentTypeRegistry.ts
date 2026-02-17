import { getSupabaseAdmin } from '@/lib/db/client';

// ====================================
// Content Type Registry Service
// Central service to load and resolve content types with site-specific overrides
// ====================================

export interface ResolvedContentType {
  id: string;
  key: string;
  label: string;
  description: string | null;
  
  // Template (merged with overrides)
  templateSchema: any;
  
  // Prompts (merged with overrides)
  systemPrompt: string | null;
  stylePrompt: string | null;
  planPrompt: string | null;
  formatPrompt: string | null;
  
  // Validation (merged with overrides)
  validatorProfile: any;
  allowedHtmlTags: string[];
  forbiddenPatterns: string[];
  
  // Metadata
  source: 'canonical' | 'overridden';
  overrides: string[]; // List of overridden fields
  isEnabled: boolean;
}

/**
 * Get a content type for a specific site (with overrides applied)
 */
export async function getContentTypeForSite(
  siteId: string,
  contentTypeKey: string
): Promise<ResolvedContentType | null> {
  const supabase = getSupabaseAdmin();
  
  // Load canonical content type
  const { data: contentType, error: contentTypeError } = await supabase
    .from('editorial_content_types')
    .select('*')
    .eq('key', contentTypeKey)
    .eq('is_active', true)
    .single();
  
  if (contentTypeError || !contentType) {
    return null;
  }
  
  // Load site-specific settings (if exist)
  const { data: siteSettings } = await supabase
    .from('site_content_type_settings')
    .select('*')
    .eq('site_id', siteId)
    .eq('content_type_id', contentType.id)
    .maybeSingle();
  
  // Check if disabled for this site
  if (siteSettings && !siteSettings.is_enabled) {
    return null;
  }
  
  // Merge canonical + overrides
  return resolveContentType(contentType, siteSettings);
}

/**
 * Get all enabled content types for a site (with overrides applied)
 */
export async function getEnabledContentTypes(
  siteId: string
): Promise<ResolvedContentType[]> {
  const supabase = getSupabaseAdmin();
  
  // Load all active content types
  const { data: contentTypes, error: contentTypesError } = await supabase
    .from('editorial_content_types')
    .select('*')
    .eq('is_active', true)
    .order('key');
  
  if (contentTypesError || !contentTypes) {
    return [];
  }
  
  // Load site settings (all at once)
  const { data: siteSettings } = await supabase
    .from('site_content_type_settings')
    .select('*')
    .eq('site_id', siteId);
  
  const settingsMap = new Map(
    (siteSettings || []).map(s => [s.content_type_id, s])
  );
  
  // Resolve each content type with its settings
  const resolved: ResolvedContentType[] = [];
  
  for (const contentType of contentTypes) {
    const settings = settingsMap.get(contentType.id);
    
    // Skip ONLY if explicitly disabled for this site
    if (settings && settings.is_enabled === false) {
      continue;
    }
    
    // SIMPLIFIED: Include all active types, even without settings
    // settings will be null if not configured (uses defaults)
    resolved.push(resolveContentType(contentType, settings));
  }
  
  return resolved;
}

/**
 * Resolve a content type by merging canonical values with overrides
 */
function resolveContentType(
  contentType: any,
  siteSettings: any | null
): ResolvedContentType {
  const overrides: string[] = [];
  
  // Helper to get value with override
  function getValue<T>(
    canonicalValue: T,
    overrideValue: T | null | undefined,
    fieldName: string
  ): T {
    if (overrideValue !== null && overrideValue !== undefined) {
      overrides.push(fieldName);
      return overrideValue;
    }
    return canonicalValue;
  }
  
  return {
    id: contentType.id,
    key: contentType.key,
    label: contentType.label,
    description: contentType.description,
    
    // Template
    templateSchema: getValue(
      contentType.template_schema,
      siteSettings?.template_schema_override,
      'templateSchema'
    ),
    
    // Prompts
    systemPrompt: getValue(
      contentType.system_prompt,
      siteSettings?.system_prompt_override,
      'systemPrompt'
    ),
    stylePrompt: getValue(
      contentType.style_prompt,
      siteSettings?.style_prompt_override,
      'stylePrompt'
    ),
    planPrompt: getValue(
      contentType.plan_prompt,
      siteSettings?.plan_prompt_override,
      'planPrompt'
    ),
    formatPrompt: getValue(
      contentType.format_prompt,
      siteSettings?.format_prompt_override,
      'formatPrompt'
    ),
    
    // Validation
    validatorProfile: getValue(
      contentType.validator_profile,
      siteSettings?.validator_profile_override,
      'validatorProfile'
    ),
    allowedHtmlTags: getValue(
      contentType.allowed_html_tags,
      siteSettings?.allowed_html_tags_override,
      'allowedHtmlTags'
    ),
    forbiddenPatterns: getValue(
      contentType.forbidden_patterns,
      siteSettings?.forbidden_patterns_override,
      'forbiddenPatterns'
    ),
    
    // Metadata
    source: overrides.length > 0 ? 'overridden' : 'canonical',
    overrides,
    isEnabled: true, // If we got here, it's enabled
  };
}

/**
 * Get content type by ID (with site overrides)
 */
export async function getContentTypeById(
  siteId: string,
  contentTypeId: string
): Promise<ResolvedContentType | null> {
  const supabase = getSupabaseAdmin();
  
  // Load content type
  const { data: contentType, error } = await supabase
    .from('editorial_content_types')
    .select('*')
    .eq('id', contentTypeId)
    .eq('is_active', true)
    .single();
  
  if (error || !contentType) {
    return null;
  }
  
  // Load site settings
  const { data: siteSettings } = await supabase
    .from('site_content_type_settings')
    .select('*')
    .eq('site_id', siteId)
    .eq('content_type_id', contentTypeId)
    .maybeSingle();
  
  if (siteSettings && !siteSettings.is_enabled) {
    return null;
  }
  
  return resolveContentType(contentType, siteSettings);
}

/**
 * List all content types (canonical, without overrides) - for admin UI
 */
export async function listAllContentTypes(): Promise<any[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('editorial_content_types')
    .select('*')
    .order('key');
  
  if (error) {
    throw error;
  }
  
  return data || [];
}

/**
 * Get content type statistics for a site
 */
export async function getContentTypeStats(siteId: string): Promise<{
  total: number;
  enabled: number;
  disabled: number;
  withOverrides: number;
}> {
  const supabase = getSupabaseAdmin();
  
  // Count total content types
  const { count: total } = await supabase
    .from('editorial_content_types')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  // Count site settings
  const { data: settings } = await supabase
    .from('site_content_type_settings')
    .select('is_enabled, template_schema_override, system_prompt_override, validator_profile_override')
    .eq('site_id', siteId);
  
  const enabled = settings?.filter(s => s.is_enabled).length || 0;
  const disabled = settings?.filter(s => !s.is_enabled).length || 0;
  
  const withOverrides = settings?.filter(s => 
    s.template_schema_override !== null ||
    s.system_prompt_override !== null ||
    s.validator_profile_override !== null
  ).length || 0;
  
  return {
    total: total || 0,
    enabled,
    disabled,
    withOverrides,
  };
}
