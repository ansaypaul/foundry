import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';
import { getContentTypeForSite } from '@/lib/services/contentTypes/contentTypeRegistry';

interface RouteParams {
  params: Promise<{ id: string; key: string }>;
}

// ====================================
// GET /api/admin/sites/[id]/content-type-settings/[key]
// Get one content type setting with canonical + overrides
// ====================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: siteId, key: contentTypeKey } = await params;
    
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
    
    // Get content type
    const { data: contentType, error: ctError } = await supabase
      .from('editorial_content_types')
      .select('*')
      .eq('key', contentTypeKey)
      .single();
    
    if (ctError || !contentType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }
    
    // Get site setting
    const { data: setting, error: settingError } = await supabase
      .from('site_content_type_settings')
      .select('*')
      .eq('site_id', siteId)
      .eq('content_type_id', contentType.id)
      .maybeSingle();
    
    // Build response with canonical + override values
    const response = {
      contentType: {
        id: contentType.id,
        key: contentType.key,
        label: contentType.label,
        description: contentType.description,
        is_system: contentType.is_system,
      },
      canonical: {
        template_schema: contentType.template_schema,
        system_prompt: contentType.system_prompt,
        style_prompt: contentType.style_prompt,
        plan_prompt: contentType.plan_prompt,
        format_prompt: contentType.format_prompt,
        validator_profile: contentType.validator_profile,
        allowed_html_tags: contentType.allowed_html_tags,
        forbidden_patterns: contentType.forbidden_patterns,
      },
      overrides: setting ? {
        template_schema: setting.template_schema_override,
        system_prompt: setting.system_prompt_override,
        style_prompt: setting.style_prompt_override,
        plan_prompt: setting.plan_prompt_override,
        format_prompt: setting.format_prompt_override,
        validator_profile: setting.validator_profile_override,
        allowed_html_tags: setting.allowed_html_tags_override,
        forbidden_patterns: setting.forbidden_patterns_override,
      } : null,
      isEnabled: setting?.is_enabled ?? false,
      settingExists: !!setting,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /sites/[id]/content-type-settings/[key]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// PATCH /api/admin/sites/[id]/content-type-settings/[key]
// Update content type settings/overrides for a site
// ====================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: siteId, key: contentTypeKey } = await params;
    
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
    
    const supabase = getSupabaseAdmin();
    
    // Get content type ID from key
    const { data: contentType, error: ctError } = await supabase
      .from('editorial_content_types')
      .select('id')
      .eq('key', contentTypeKey)
      .single();
    
    if (ctError || !contentType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }
    
    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Handle is_enabled toggle
    if ('is_enabled' in body) {
      updates.is_enabled = body.is_enabled;
    }
    
    // Handle overrides
    const overrideFields = [
      'template_schema_override',
      'system_prompt_override',
      'style_prompt_override',
      'plan_prompt_override',
      'format_prompt_override',
      'validator_profile_override',
      'allowed_html_tags_override',
      'forbidden_patterns_override',
    ];
    
    for (const field of overrideFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    
    // Upsert setting
    const { data, error } = await supabase
      .from('site_content_type_settings')
      .upsert({
        site_id: siteId,
        content_type_id: contentType.id,
        ...updates,
      }, {
        onConflict: 'site_id,content_type_id',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating content type setting:', error);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Content type setting updated successfully',
      setting: data,
    });
  } catch (error) {
    console.error('Error in PATCH /sites/[id]/content-type-settings/[key]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// POST /api/admin/sites/[id]/content-type-settings/[key]/enable
// Enable a content type for a site
// ====================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: siteId, key: contentTypeKey } = await params;
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();
    
    if (action !== 'enable' && action !== 'disable') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    // Verify site exists
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    // TODO: Add auth check
    
    const supabase = getSupabaseAdmin();
    
    // Get content type ID
    const { data: contentType, error: ctError } = await supabase
      .from('editorial_content_types')
      .select('id')
      .eq('key', contentTypeKey)
      .single();
    
    if (ctError || !contentType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }
    
    const isEnabled = action === 'enable';
    
    // Upsert setting
    const { data, error } = await supabase
      .from('site_content_type_settings')
      .upsert({
        site_id: siteId,
        content_type_id: contentType.id,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,content_type_id',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating content type setting:', error);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: `Content type ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      setting: data,
    });
  } catch (error) {
    console.error('Error in enable/disable action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
