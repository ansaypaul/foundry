import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List AI jobs for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const { searchParams } = new URL(request.url);
    
    const statusFilter = searchParams.get('status');
    const kindFilter = searchParams.get('kind');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('ai_job')
      .select('*')
      .eq('site_id', siteId);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (kindFilter && kindFilter !== 'all') {
      query = query.eq('kind', kindFilter);
    }

    const { data: jobs, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      jobs: jobs || [],
    });
  } catch (error) {
    console.error('Error fetching AI jobs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des jobs AI' },
      { status: 500 }
    );
  }
}
