import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ key: string }>;
}

// ====================================
// GET /api/admin/editorial-content-types/[key]
// Get one content type by key
// ====================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    const supabase = getSupabaseAdmin();
    
    // TODO: Add auth check
    
    const { data, error } = await supabase
      .from('editorial_content_types')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ contentType: data });
  } catch (error) {
    console.error('Error in GET /editorial-content-types/[key]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// PATCH /api/admin/editorial-content-types/[key]
// Update a content type (super admin only)
// ====================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    
    // TODO: Add auth check (super admin only)
    
    const body = await request.json();
    const updates: any = {};
    
    // Only update provided fields
    const allowedFields = [
      'label',
      'description',
      'is_active',
      'template_schema',
      'system_prompt',
      'style_prompt',
      'plan_prompt',
      'format_prompt',
      'notes',
      'validator_profile',
      'allowed_html_tags',
      'forbidden_patterns',
    ];
    
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Add updated_at
    updates.updated_at = new Date().toISOString();
    
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('editorial_content_types')
      .update(updates)
      .eq('key', key)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating content type:', error);
      return NextResponse.json(
        { error: 'Failed to update content type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Content type updated successfully',
      contentType: data,
    });
  } catch (error) {
    console.error('Error in PATCH /editorial-content-types/[key]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ====================================
// DELETE /api/admin/editorial-content-types/[key]
// Delete a content type (non-system only, super admin only)
// ====================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    
    // TODO: Add auth check (super admin only)
    
    const supabase = getSupabaseAdmin();
    
    // Check if content type exists and is not system
    const { data: contentType, error: fetchError } = await supabase
      .from('editorial_content_types')
      .select('id, key, is_system')
      .eq('key', key)
      .single();
    
    if (fetchError || !contentType) {
      return NextResponse.json(
        { error: 'Content type not found' },
        { status: 404 }
      );
    }
    
    if (contentType.is_system) {
      return NextResponse.json(
        { error: 'System content types cannot be deleted' },
        { status: 403 }
      );
    }
    
    // Delete content type
    const { error } = await supabase
      .from('editorial_content_types')
      .delete()
      .eq('key', key);
    
    if (error) {
      console.error('Error deleting content type:', error);
      return NextResponse.json(
        { error: 'Failed to delete content type' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Content type deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /editorial-content-types/[key]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
