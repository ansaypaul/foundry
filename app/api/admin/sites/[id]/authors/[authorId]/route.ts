import { NextRequest, NextResponse } from 'next/server';
import { getAuthorById, updateAuthor, deleteAuthor } from '@/lib/db/authors-queries';

interface RouteParams {
  params: Promise<{ id: string; authorId: string }>;
}

/**
 * GET /api/admin/sites/:id/authors/:authorId
 * Récupère un auteur
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorId } = await params;
    const author = await getAuthorById(authorId);
    
    if (!author) {
      return NextResponse.json(
        { error: 'Auteur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ author });
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'auteur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sites/:id/authors/:authorId
 * Met à jour un auteur
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorId } = await params;
    const body = await request.json();
    
    const {
      display_name,
      email,
      bio,
      avatar_url,
      website_url,
      twitter_username,
      facebook_url,
      linkedin_url,
      instagram_username,
      github_username,
    } = body;
    
    // Préparer les mises à jour
    const updates: any = {};
    
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (email !== undefined) updates.email = email?.trim() || null;
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url?.trim() || null;
    if (website_url !== undefined) updates.website_url = website_url?.trim() || null;
    if (twitter_username !== undefined) updates.twitter_username = twitter_username?.trim() || null;
    if (facebook_url !== undefined) updates.facebook_url = facebook_url?.trim() || null;
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url?.trim() || null;
    if (instagram_username !== undefined) updates.instagram_username = instagram_username?.trim() || null;
    if (github_username !== undefined) updates.github_username = github_username?.trim() || null;
    
    // Mettre à jour
    const author = await updateAuthor(authorId, updates);
    
    return NextResponse.json({ author });
  } catch (error: any) {
    console.error('Error updating author:', error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Un auteur avec ce slug existe déjà' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'auteur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sites/:id/authors/:authorId
 * Supprime un auteur
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorId } = await params;
    
    const success = await deleteAuthor(authorId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'auteur' },
      { status: 500 }
    );
  }
}
