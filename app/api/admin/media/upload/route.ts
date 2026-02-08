import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Note: Pour l'instant, c'est un placeholder
    // L'upload réel vers Supabase Storage sera implémenté plus tard
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation basique
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 5MB)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté' },
        { status: 400 }
      );
    }

    // TODO: Upload vers Supabase Storage
    // Pour l'instant, on retourne juste un succès
    
    return NextResponse.json({ 
      success: true,
      message: 'Upload basique configuré. Supabase Storage sera intégré prochainement.'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
