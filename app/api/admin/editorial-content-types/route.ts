import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { listAllContentTypes } from '@/lib/services/contentTypes/contentTypeRegistry';

// ====================================
// GET /api/admin/editorial-content-types
// List all content types (admin only)
// ====================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // TODO: Add auth check (super admin only)
    // For now, allow all

    // Get query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'active', 'inactive', 'system', 'custom'
    
    let query = supabase
      .from('editorial_content_types')
      .select('*')
      .order('key');
    
    // Apply filters
    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    } else if (filter === 'system') {
      query = query.eq('is_system', true);
    } else if (filter === 'custom') {
      query = query.eq('is_system', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching content types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content types' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      contentTypes: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /editorial-content-types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// POST /api/admin/editorial-content-types
// Create a new content type (super admin only)
// ====================================

export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check (super admin only)
    
    const body = await request.json();
    const {
      key,
      label,
      description,
      is_system = false,
      is_active = true,
      template_schema,
      system_prompt,
      style_prompt,
      plan_prompt,
      format_prompt,
      notes,
      validator_profile,
      allowed_html_tags,
      forbidden_patterns,
    } = body;
    
    // Validation
    if (!key || !label) {
      return NextResponse.json(
        { error: 'key and label are required' },
        { status: 400 }
      );
    }
    
    if (!template_schema || !validator_profile) {
      return NextResponse.json(
        { error: 'template_schema and validator_profile are required' },
        { status: 400 }
      );
    }
    
    // Validate key format (lowercase, alphanumeric + underscore)
    if (!/^[a-z0-9_]+$/.test(key)) {
      return NextResponse.json(
        { error: 'key must be lowercase alphanumeric with underscores only' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseAdmin();
    
    // Check if key already exists
    const { data: existing } = await supabase
      .from('editorial_content_types')
      .select('id')
      .eq('key', key)
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json(
        { error: 'A content type with this key already exists' },
        { status: 409 }
      );
    }
    
    // Create content type
    const { data, error } = await supabase
      .from('editorial_content_types')
      .insert({
        key,
        label,
        description: description || null,
        is_system,
        is_active,
        template_schema,
        system_prompt: system_prompt || null,
        style_prompt: style_prompt || null,
        plan_prompt: plan_prompt || null,
        format_prompt: format_prompt || null,
        notes: notes || null,
        validator_profile,
        allowed_html_tags: allowed_html_tags || ['h2', 'p', 'b', 'i', 'strong', 'em', 'ul', 'li'],
        forbidden_patterns: forbidden_patterns || ['—'],
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating content type:', error);
      return NextResponse.json(
        { error: 'Failed to create content type', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Content type created successfully',
      contentType: data,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /editorial-content-types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
