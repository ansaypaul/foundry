import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

export interface CategoryPlan {
  name: string;
  slug: string;
  parentSlug?: string | null;
  order: number;
}

// Category templates by site_type
const CATEGORY_TEMPLATES: Record<string, string[]> = {
  niche_passion: [
    'Anime',
    'Manga',
    'Jeux vidéo',
    'Actualité',
    'Critiques & Tests',
    'Dossiers',
    'Interviews',
    'Culture japonaise',
    'Streaming & Plateformes',
    'Événements',
  ],
  news_media: [
    'Actualité',
    'Politique',
    'Économie',
    'Société',
    'International',
    'Culture',
    'Sport',
    'Tech & Science',
    'Environnement',
    'Opinion',
    'En bref',
    'Enquêtes',
  ],
  gaming_popculture: [
    'Jeux vidéo',
    'Tests & Reviews',
    'Actualité Gaming',
    'Esport',
    'Culture Pop',
    'Cinéma & Séries',
    'Comics & BD',
    'Musique',
    'Streaming',
    'Events & Conventions',
  ],
  affiliate_guides: [
    'Guides d\'achat',
    'Comparatifs',
    'Tests produits',
    'Bons plans',
    'High-tech',
    'Maison & Jardin',
    'Sport & Fitness',
    'Beauté & Santé',
    'Voyage',
    'Auto & Moto',
  ],
  lifestyle: [
    'Mode & Style',
    'Beauté & Bien-être',
    'Voyage',
    'Gastronomie',
    'Décoration',
    'Culture',
    'Développement personnel',
    'Famille & Enfants',
    'Loisirs',
    'Technologie',
  ],
};

/**
 * Generate slug from category name
 */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/&/g, 'et') // Replace & with et
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
    .replace(/^-|-$/g, ''); // Remove leading/trailing -
}

// Starter cap by site size (don't create too many categories at bootstrap)
const STARTER_CAP_BY_SIZE: Record<string, number> = {
  small: 4,
  medium: 8,
  large: 10,
};

/**
 * Build deterministic category plan
 */
export function buildCategoryPlan(args: {
  siteType: string;
  description?: string | null;
  profile: SiteDecisionProfile;
}): CategoryPlan[] {
  const { siteType, description, profile } = args;

  // 1. Calculate default count
  const defaultCount = Math.round((profile.targets.categories.min + profile.targets.categories.max) / 2);
  
  // 2. Apply starter cap (don't create too many categories at bootstrap)
  const starterCap = STARTER_CAP_BY_SIZE[profile.siteSize] || 8;
  const finalCount = Math.min(defaultCount, starterCap);

  // 3. Get base template
  const template = CATEGORY_TEMPLATES[siteType] || CATEGORY_TEMPLATES['niche_passion'];
  let categories = [...template].slice(0, finalCount);

  // 4. Keyword-based swaps (deterministic)
  if (description) {
    const descLower = description.toLowerCase();

    // If contains "voyage" and not already in list
    if (descLower.includes('voyage') && !categories.some(c => c.toLowerCase().includes('voyage'))) {
      categories[categories.length - 1] = 'Voyage';
    }
    
    // If contains "musique" or "j-pop" and not already in list
    if ((descLower.includes('musique') || descLower.includes('j-pop')) && 
        !categories.some(c => c.toLowerCase().includes('musique'))) {
      categories[categories.length - 1] = 'Musique';
    }
  }

  // 5. Build plan with slugs and order
  return categories.map((name, index) => ({
    name,
    slug: slugifyCategory(name),
    parentSlug: null,
    order: index,
  }));
}

/**
 * Filter plan to only include categories that don't exist yet
 */
export function filterMissingCategories(
  plan: CategoryPlan[],
  existingSlugs: string[]
): CategoryPlan[] {
  return plan.filter(cat => !existingSlugs.includes(cat.slug));
}
