import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const supabase = getSupabaseAdmin();

    // Récupérer tous les utilisateurs ayant accès à ce site
    const { data: memberships } = await supabase
      .from('memberships')
      .select(`
        users (
          id,
          name,
          email
        )
      `)
      .eq('site_id', siteId);

    // Extraire les utilisateurs uniques
    const authors = memberships
      ?.map((m: any) => m.users)
      .filter(Boolean) || [];

    return NextResponse.json({ authors });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des auteurs' },
      { status: 500 }
    );
  }
}
