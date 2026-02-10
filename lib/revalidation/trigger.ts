/**
 * Helper pour trigger la revalidation ISR depuis l'admin
 */

interface RevalidateOptions {
  siteId: string;
  slug: string;
}

/**
 * Invalide le cache ISR d'une page après publication
 * 
 * Usage dans l'admin après avoir sauvé un article :
 * await triggerRevalidation({ siteId, slug: content.slug })
 */
export async function triggerRevalidation({ siteId, slug }: RevalidateOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/${slug}`,
        siteId,
        secret: process.env.REVALIDATE_SECRET,
      }),
    });

    if (!response.ok) {
      console.error('[Revalidation] Failed:', await response.text());
      return false;
    }

    const data = await response.json();
    console.log('[Revalidation] Success:', data);
    return true;
  } catch (error) {
    console.error('[Revalidation] Error:', error);
    return false;
  }
}

/**
 * Invalide plusieurs pages en même temps
 */
export async function triggerBulkRevalidation(items: RevalidateOptions[]): Promise<void> {
  await Promise.all(items.map(item => triggerRevalidation(item)));
}

/**
 * Invalide toute une catégorie ou tag
 */
export async function triggerCategoryRevalidation(siteId: string, categorySlug: string): Promise<boolean> {
  return triggerRevalidation({ siteId, slug: `category/${categorySlug}` });
}

/**
 * Invalide la homepage d'un site
 */
export async function triggerHomepageRevalidation(siteId: string): Promise<boolean> {
  return triggerRevalidation({ siteId, slug: '' });
}
