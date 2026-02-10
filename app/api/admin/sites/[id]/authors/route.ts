import { NextRequest, NextResponse } from 'next/server';
import { getAuthorsBySiteId, createAuthor, generateUniqueAuthorSlug } from '@/lib/db/authors-queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/sites/:id/authors
 * Liste tous les auteurs d'un site
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const authors = await getAuthorsBySiteId(siteId);
    
    return NextResponse.json({ authors });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des auteurs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sites/:id/authors
 * Crée un nouvel auteur
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();
    
    const {
      user_id,
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
    
    // Valider les champs requis
    if (!display_name) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }
    
    // Générer un slug unique
    const slug = await generateUniqueAuthorSlug(siteId, display_name);
    
    // Créer l'auteur
    const author = await createAuthor({
      site_id: siteId,
      user_id: user_id || null,
      slug,
      display_name: display_name.trim(),
      email: email?.trim() || null,
      bio: bio?.trim() || null,
      avatar_url: avatar_url?.trim() || null,
      website_url: website_url?.trim() || null,
      twitter_username: twitter_username?.trim() || null,
      facebook_url: facebook_url?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
      instagram_username: instagram_username?.trim() || null,
      github_username: github_username?.trim() || null,
    });
    
    return NextResponse.json({ author }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating author:', error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Un auteur avec ce slug existe déjà' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'auteur' },
      { status: 500 }
    );
  }
}
