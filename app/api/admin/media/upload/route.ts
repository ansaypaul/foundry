import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const siteId = formData.get('site_id') as string;
    const alt = formData.get('alt') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'site_id est requis' },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 5MB)' },
        { status: 400 }
      );
    }

    // Validation du type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Formats acceptés: JPG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Retirer l'extension
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // Limiter la longueur
    
    const filename = `${sanitizedName}-${timestamp}-${randomStr}.${ext}`;
    const storagePath = `${siteId}/${filename}`;

    // Upload vers Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload vers le stockage' },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(storagePath);

    // Enregistrer dans la base de données
    const { data: media, error: dbError } = await supabase
      .from('media')
      .insert({
        site_id: siteId,
        url: publicUrl,
        filename: file.name,
        storage_path: storagePath,
        alt_text: alt || null,
        title: sanitizedName,
        mime_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Supprimer le fichier du storage en cas d'erreur
      await supabase.storage.from('media').remove([storagePath]);
      
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement en base de données' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      media,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
