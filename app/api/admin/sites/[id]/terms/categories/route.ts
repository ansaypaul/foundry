import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List categories for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: categories, error } = await supabase
      .from('terms')
      .select('id, name, slug')
      .eq('site_id', siteId)
      .eq('type', 'category')
      .eq('status', 'active')
      .order('order')
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des catégories' },
      { status: 500 }
    );
  }
}
