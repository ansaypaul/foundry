import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string; jobId: string }>;
}

// GET: Get specific AI job details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId, jobId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: job, error } = await supabase
      .from('ai_job')
      .select('*')
      .eq('id', jobId)
      .eq('site_id', siteId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job AI introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching AI job:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du job AI' },
      { status: 500 }
    );
  }
}
