import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { randomBytes } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string;
    const siteId = formData.get('site_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID requis' },
        { status: 400 }
      );
    }

    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 5MB.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Générer un nom de fichier unique
    const ext = file.name.split('.').pop();
    const randomName = randomBytes(16).toString('hex');
    const fileName = `${randomName}.${ext}`;
    const filePath = `${siteId}/${fileName}`;

    // Upload vers Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 an
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Erreur lors de l\'upload vers Supabase Storage');
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Enregistrer dans la DB
    const mediaData: any = {
      site_id: siteId,
      filename: file.name,
      url: publicUrl,
      storage_path: filePath,
      mime_type: file.type,
      file_size: file.size,
    };

    // Ajouter alt_text si fourni
    if (alt) {
      mediaData.alt_text = alt;
    }

    const { data: media, error: dbError } = await supabase
      .from('media')
      .insert(mediaData)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Nettoyer le fichier uploadé
      await supabase.storage.from('media').remove([filePath]);
      throw new Error('Erreur lors de l\'enregistrement en base de données');
    }

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ media: data || [] });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des médias' },
      { status: 500 }
    );
  }
}
