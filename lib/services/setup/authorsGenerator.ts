import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

export interface AuthorPlan {
  roleKey: string;
  displayName: string;
  specialties: string[];
  isAi: boolean;
}

/**
 * Build deterministic author plan from site profile
 */
export function buildAuthorsPlan(args: {
  siteName: string;
  profile: SiteDecisionProfile;
}): AuthorPlan[] {
  const { siteName, profile } = args;
  const { targets, velocity } = profile;

  // 1. Calculate default count: round((min + max) / 2)
  const defaultCount = Math.round((targets.authors.min + targets.authors.max) / 2);

  const authors: AuthorPlan[] = [];

  // 2. Always create 1 editorial_lead
  authors.push({
    roleKey: 'editorial_lead',
    displayName: `Rédaction ${siteName}`,
    specialties: ['ligne_éditoriale', 'relecture'],
    isAi: true,
  });

  // 3. Calculate remaining slots
  let remaining = defaultCount - 1;

  // 4. Create specialists in order
  if (remaining >= 1) {
    authors.push({
      roleKey: 'specialist_anime_manga',
      displayName: 'Expert Anime & Manga',
      specialties: ['anime', 'manga'],
      isAi: true,
    });
    remaining--;
  }

  if (remaining >= 1) {
    authors.push({
      roleKey: 'specialist_gaming',
      displayName: 'Expert Gaming',
      specialties: ['jeux_vidéo', 'tests'],
      isAi: true,
    });
    remaining--;
  }

  if (remaining >= 1) {
    authors.push({
      roleKey: 'specialist_culture',
      displayName: 'Expert Culture',
      specialties: ['culture', 'société'],
      isAi: true,
    });
    remaining--;
  }

  // 5. Fill remaining with generic specialists
  let generalCounter = 1;
  while (remaining > 0) {
    authors.push({
      roleKey: `specialist_general_${generalCounter}`,
      displayName: `Spécialiste ${generalCounter}`,
      specialties: ['pop_culture'],
      isAi: true,
    });
    remaining--;
    generalCounter++;
  }

  // 6. Replace last specialist with news_writer if velocity is medium/high and we have at least 4 authors
  if ((velocity === 'medium' || velocity === 'high') && defaultCount >= 4) {
    // Find last specialist (not editorial_lead)
    const lastSpecialistIndex = authors.length - 1;
    if (lastSpecialistIndex > 0) {
      authors[lastSpecialistIndex] = {
        roleKey: 'news_writer',
        displayName: 'Rédacteur Actualité',
        specialties: ['actualité', 'annonces'],
        isAi: true,
      };
    }
  }

  return authors;
}

/**
 * Filter plan to only include authors that don't exist yet
 */
export function filterMissingAuthors(
  plan: AuthorPlan[],
  existingRoleKeys: string[]
): AuthorPlan[] {
  return plan.filter(author => !existingRoleKeys.includes(author.roleKey));
}

/**
 * Generate slug from display name
 */
export function generateAuthorSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
