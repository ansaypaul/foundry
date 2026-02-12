import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface BulkActionRequest {
  action: 'delete' | 'publish' | 'draft';
  postIds: string[];
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await context.params;
    const body: BulkActionRequest = await req.json();
    const { action, postIds } = body;

    if (!action || !postIds || postIds.length === 0) {
      return NextResponse.json(
        { error: 'Action et IDs requis' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Vérifier que tous les posts appartiennent bien au site
    const { data: posts, error: checkError } = await supabase
      .from('content')
      .select('id')
      .eq('site_id', siteId)
      .in('id', postIds);

    if (checkError || !posts || posts.length !== postIds.length) {
      return NextResponse.json(
        { error: 'Articles non trouvés ou accès non autorisé' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'delete':
        // Supprimer les posts
        const { error: deleteError } = await supabase
          .from('content')
          .delete()
          .in('id', postIds);

        if (deleteError) {
          throw deleteError;
        }

        result = { deleted: postIds.length };
        break;

      case 'publish':
        // Publier les posts
        const { error: publishError } = await supabase
          .from('content')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .in('id', postIds);

        if (publishError) {
          throw publishError;
        }

        result = { published: postIds.length };
        break;

      case 'draft':
        // Mettre en brouillon
        const { error: draftError } = await supabase
          .from('content')
          .update({
            status: 'draft',
          })
          .in('id', postIds);

        if (draftError) {
          throw draftError;
        }

        result = { drafted: postIds.length };
        break;

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Erreur lors de l\'action en masse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution de l\'action' },
      { status: 500 }
    );
  }
}
