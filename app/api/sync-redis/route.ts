import { NextResponse } from 'next/server';
import { cacheSiteId, invalidateSiteIdCache } from '@/lib/redis/client';

/**
 * Webhook Supabase pour synchroniser Redis quand un domaine change
 * 
 * Appelé automatiquement par le trigger Supabase sur INSERT/UPDATE/DELETE de la table domains
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    console.log('[Redis Sync] Webhook reçu:', payload.type);
    
    const { type, record, old_record } = payload;
    
    switch (type) {
      case 'INSERT':
      case 'UPDATE':
        // Mettre en cache le nouveau/mis à jour domaine
        if (record?.hostname && record?.site_id) {
          await cacheSiteId(record.hostname, record.site_id);
          console.log(`[Redis Sync] Cached: ${record.hostname} → ${record.site_id}`);
        }
        
        // Si l'hostname a changé, invalider l'ancien
        if (type === 'UPDATE' && old_record?.hostname && old_record.hostname !== record.hostname) {
          await invalidateSiteIdCache(old_record.hostname);
          console.log(`[Redis Sync] Invalidated old hostname: ${old_record.hostname}`);
        }
        break;
        
      case 'DELETE':
        // Supprimer le cache du domaine supprimé
        if (old_record?.hostname) {
          await invalidateSiteIdCache(old_record.hostname);
          console.log(`[Redis Sync] Invalidated: ${old_record.hostname}`);
        }
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Redis Sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
