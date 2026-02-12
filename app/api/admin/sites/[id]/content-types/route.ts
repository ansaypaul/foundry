import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List all content types for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: contentTypes, error } = await supabase
      .from('content_types')
      .select('id, key, label, description, status')
      .eq('site_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      contentTypes: contentTypes || [],
    });
  } catch (error) {
    console.error('Error fetching content types:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des types de contenu' },
      { status: 500 }
    );
  }
}
