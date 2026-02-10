import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache TTL pour hostname → siteId (24 heures)
export const HOSTNAME_CACHE_TTL = 60 * 60 * 24; // 24h en secondes

/**
 * Récupère le siteId depuis Redis pour un hostname donné
 */
export async function getSiteIdFromCache(hostname: string): Promise<string | null> {
  try {
    const siteId = await redis.get<string>(`hostname:${hostname}`);
    return siteId;
  } catch (error) {
    console.error('[Redis] Error getting siteId from cache:', error);
    return null;
  }
}

/**
 * Met en cache la relation hostname → siteId
 */
export async function cacheSiteId(hostname: string, siteId: string): Promise<void> {
  try {
    await redis.setex(`hostname:${hostname}`, HOSTNAME_CACHE_TTL, siteId);
  } catch (error) {
    console.error('[Redis] Error caching siteId:', error);
  }
}

/**
 * Supprime le cache pour un hostname donné
 */
export async function invalidateSiteIdCache(hostname: string): Promise<void> {
  try {
    await redis.del(`hostname:${hostname}`);
  } catch (error) {
    console.error('[Redis] Error invalidating cache:', error);
  }
}
