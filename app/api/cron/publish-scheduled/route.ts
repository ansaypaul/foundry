import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

// Cette route est appelée par Vercel Cron toutes les minutes
// pour publier automatiquement les articles programmés

export async function GET(request: Request) {
  try {
    // Vérifier le token de sécurité (seul Vercel Cron peut appeler)
    const authHeader = request.headers.get('authorization');
    const token = process.env.CRON_SECRET;
    
    if (!token || authHeader !== `Bearer ${token}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Trouver tous les articles programmés dont la date est passée
    const { data: scheduledContent, error: fetchError } = await supabase
      .from('content')
      .select('id, title, slug, published_at')
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled content:', fetchError);
      return NextResponse.json(
        { error: 'Database error', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!scheduledContent || scheduledContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled content to publish',
        published: 0,
      });
    }

    // Passer tous ces articles en statut "published"
    const { data: updatedContent, error: updateError } = await supabase
      .from('content')
      .update({ status: 'published' })
      .in('id', scheduledContent.map(c => c.id))
      .select();

    if (updateError) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { error: 'Update error', details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Published ${updatedContent.length} scheduled articles`);
    
    return NextResponse.json({
      success: true,
      message: `Published ${updatedContent.length} article(s)`,
      published: updatedContent.length,
      articles: updatedContent.map(c => ({ id: c.id, title: c.title, slug: c.slug })),
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
