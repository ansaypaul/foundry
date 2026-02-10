import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * API route pour invalider le cache ISR d'une page spécifique
 * 
 * Usage depuis l'admin après publication d'un article :
 * fetch('/api/revalidate?path=/article-slug&secret=xxx')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');
    const siteId = searchParams.get('siteId');
    
    // Vérifier le secret
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    // Vérifier le path
    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }
    
    // Construire le chemin complet avec siteId
    const fullPath = siteId ? `/sites/${siteId}${path}` : path;
    
    // Invalider le cache ISR
    revalidatePath(fullPath);
    
    console.log(`[Revalidation] Invalidated: ${fullPath}`);
    
    return NextResponse.json({ 
      revalidated: true, 
      path: fullPath,
      now: Date.now() 
    });
  } catch (error) {
    console.error('[Revalidation] Error:', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}

/**
 * Version POST pour usage depuis l'admin avec body JSON
 */
export async function POST(request: Request) {
  try {
    const { path, secret, siteId } = await request.json();
    
    // Vérifier le secret
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    // Vérifier le path
    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }
    
    // Construire le chemin complet avec siteId
    const fullPath = siteId ? `/sites/${siteId}${path}` : path;
    
    // Invalider le cache ISR
    revalidatePath(fullPath);
    
    console.log(`[Revalidation] Invalidated: ${fullPath}`);
    
    return NextResponse.json({ 
      revalidated: true, 
      path: fullPath,
      now: Date.now() 
    });
  } catch (error) {
    console.error('[Revalidation] Error:', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
