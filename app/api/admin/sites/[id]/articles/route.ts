import { NextRequest, NextResponse } from 'next/server';
import { createArticle } from '@/lib/services/articles/createArticle';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Create new article
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const {
      title,
      contentHtml,
      contentTypeKey,
      authorId,
      categoryId,
      status,
      excerpt,
    } = body;

    // Validation
    if (!title || !contentHtml || !contentTypeKey || !authorId) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Create article
    const result = await createArticle({
      siteId,
      title,
      contentHtml,
      contentTypeKey,
      authorId,
      categoryId,
      status: status || 'draft',
      excerpt,
    });

    if (!result.success) {
      if (result.validationErrors) {
        return NextResponse.json(
          {
            error: 'Validation échouée',
            validationErrors: result.validationErrors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: result.error || 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Article créé avec succès',
      articleId: result.articleId,
      slug: result.slug,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
