import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';
import { getEnabledContentTypes, getContentTypeStats } from '@/lib/services/contentTypes/contentTypeRegistry';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ====================================
// GET /api/admin/sites/[id]/content-type-settings
// List all content type settings for a site
// ====================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: siteId } = await params;
    
    // Verify site exists
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    // TODO: Add auth check (site owner or admin)
    
    const supabase = getSupabaseAdmin();
    
    // Get all content types with their site settings
    const { data: contentTypes, error: ctError } = await supabase
      .from('editorial_content_types')
      .select('*')
      .eq('is_active', true)
      .order('key');
    
    if (ctError) {
      throw ctError;
    }
    
    // Get all site settings
    const { data: siteSettings, error: settingsError } = await supabase
      .from('site_content_type_settings')
      .select('*')
      .eq('site_id', siteId);
    
    if (settingsError) {
      throw settingsError;
    }
    
    const settingsMap = new Map(
      (siteSettings || []).map(s => [s.content_type_id, s])
    );
    
    // Combine content types with their settings
    const combined = (contentTypes || []).map(ct => {
      const settings = settingsMap.get(ct.id);
      
      return {
        contentType: {
          id: ct.id,
          key: ct.key,
          label: ct.label,
          description: ct.description,
          is_system: ct.is_system,
        },
        settings: settings || null,
        // SIMPLIFIED: Enabled by default if no settings exist
        isEnabled: settings?.is_enabled ?? true,
        hasOverrides: settings ? (
          settings.template_schema_override !== null ||
          settings.system_prompt_override !== null ||
          settings.style_prompt_override !== null ||
          settings.plan_prompt_override !== null ||
          settings.format_prompt_override !== null ||
          settings.validator_profile_override !== null ||
          settings.allowed_html_tags_override !== null ||
          settings.forbidden_patterns_override !== null
        ) : false,
      };
    });
    
    // Get stats
    const stats = await getContentTypeStats(siteId);
    
    return NextResponse.json({
      contentTypes: combined,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /sites/[id]/content-type-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// POST /api/admin/sites/[id]/content-type-settings
// Initialize or batch update content type settings
// ====================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: siteId } = await params;
    
    // Verify site exists
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    // TODO: Add auth check (site owner or admin)
    
    const body = await request.json();
    const { action, contentTypeIds } = body;
    
    if (action === 'initialize_all') {
      // Initialize settings for all active content types
      return await initializeAllContentTypes(siteId);
    }
    
    if (action === 'enable_multiple' && contentTypeIds) {
      return await enableMultipleContentTypes(siteId, contentTypeIds);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /sites/[id]/content-type-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// Helper functions
// ====================================

async function initializeAllContentTypes(siteId: string) {
  const supabase = getSupabaseAdmin();
  
  // Get all active content types
  const { data: contentTypes, error: ctError } = await supabase
    .from('editorial_content_types')
    .select('id')
    .eq('is_active', true);
  
  if (ctError || !contentTypes) {
    return NextResponse.json(
      { error: 'Failed to fetch content types' },
      { status: 500 }
    );
  }
  
  let created = 0;
  let skipped = 0;
  
  for (const ct of contentTypes) {
    // Check if exists
    const { data: existing } = await supabase
      .from('site_content_type_settings')
      .select('id')
      .eq('site_id', siteId)
      .eq('content_type_id', ct.id)
      .maybeSingle();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Create setting
    const { error } = await supabase
      .from('site_content_type_settings')
      .insert({
        site_id: siteId,
        content_type_id: ct.id,
        is_enabled: true,
      });
    
    if (!error) {
      created++;
    }
  }
  
  return NextResponse.json({
    message: 'Content type settings initialized',
    created,
    skipped,
  });
}

async function enableMultipleContentTypes(siteId: string, contentTypeIds: string[]) {
  const supabase = getSupabaseAdmin();
  
  let enabled = 0;
  
  for (const contentTypeId of contentTypeIds) {
    // Upsert setting
    const { error } = await supabase
      .from('site_content_type_settings')
      .upsert({
        site_id: siteId,
        content_type_id: contentTypeId,
        is_enabled: true,
      }, {
        onConflict: 'site_id,content_type_id',
      });
    
    if (!error) {
      enabled++;
    }
  }
  
  return NextResponse.json({
    message: 'Content types enabled',
    enabled,
  });
}
