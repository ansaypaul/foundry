/**
 * Script de migration pour peupler Redis avec tous les domaines existants
 * 
 * Usage : npx tsx scripts/populate-redis.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { redis, cacheSiteId } from '../lib/redis/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function populateRedis() {
  console.log('[Redis Migration] Starting...');
  
  try {
    // Récupérer tous les domaines actifs
    const { data: domains, error } = await supabase
      .from('domains')
      .select('hostname, site_id, site:sites!inner(status)')
      .eq('site.status', 'active');
    
    if (error) {
      throw error;
    }
    
    if (!domains || domains.length === 0) {
      console.log('[Redis Migration] No domains found');
      return;
    }
    
    console.log(`[Redis Migration] Found ${domains.length} domains to cache`);
    
    // Mettre en cache tous les domaines
    for (const domain of domains) {
      await cacheSiteId(domain.hostname, domain.site_id);
      console.log(`[Redis Migration] ✓ ${domain.hostname} → ${domain.site_id}`);
    }
    
    console.log(`[Redis Migration] ✅ Successfully cached ${domains.length} domains`);
    
  } catch (error) {
    console.error('[Redis Migration] Error:', error);
    process.exit(1);
  }
}

populateRedis();
