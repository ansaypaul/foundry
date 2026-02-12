import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List authors for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: authors, error } = await supabase
      .from('authors')
      .select('id, display_name, role_key, status')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .order('display_name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ authors: authors || [] });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des auteurs' },
      { status: 500 }
    );
  }
}
