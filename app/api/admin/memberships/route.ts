import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, site_id, role } = body;

    if (!user_id || !site_id || !role) {
      return NextResponse.json(
        { error: 'user_id, site_id et role requis' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: membership, error } = await supabase
      .from('memberships')
      .insert({ user_id, site_id, role })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Cet utilisateur a déjà accès à ce site' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error creating membership:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
