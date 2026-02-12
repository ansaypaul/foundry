import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

export interface ContentTypeRules {
  format: string;
  allowed_tags: string[];
  constraints: {
    no_emojis: boolean;
    no_em_dash: boolean;
    no_generic_conclusion: boolean;
    max_lists: number;
    min_list_items: number;
    min_paragraphs_per_h2: number;
  };
  length: {
    min_words: number;
    target_words: number;
  };
  structure: {
    required_sections: string[];
    h2_count_target: number;
  };
  defaults: {
    preferred_author_role_keys: string[];
  };
}

export interface ContentTypePlan {
  key: string;
  label: string;
  description?: string;
  rulesJson: ContentTypeRules;
}

// Bootstrap cap by site size
const CONTENT_TYPE_CAP_BY_SIZE: Record<string, number> = {
  small: 3,
  medium: 4,
  large: 5,
};

// Content type candidates by site_type
const CONTENT_TYPE_CANDIDATES: Record<string, Array<{ key: string; label: string; description?: string }>> = {
  niche_passion: [
    { key: 'news', label: 'Actualité', description: 'Article d\'actualité courte' },
    { key: 'review_test', label: 'Critique / Test', description: 'Test ou critique détaillée' },
    { key: 'feature_dossier', label: 'Dossier', description: 'Article de fond thématique' },
    { key: 'evergreen_guide', label: 'Guide', description: 'Guide pratique evergreen' },
    { key: 'interview', label: 'Interview', description: 'Interview personnalité' },
  ],
  news_media: [
    { key: 'news', label: 'Actualité', description: 'Article d\'actualité' },
    { key: 'analysis', label: 'Analyse', description: 'Analyse approfondie' },
    { key: 'investigation', label: 'Enquête', description: 'Enquête journalistique' },
    { key: 'interview', label: 'Interview', description: 'Interview' },
    { key: 'opinion', label: 'Tribune', description: 'Article d\'opinion' },
  ],
  gaming_popculture: [
    { key: 'news', label: 'Actualité', description: 'News gaming' },
    { key: 'review_test', label: 'Test', description: 'Test de jeu ou produit' },
    { key: 'feature_dossier', label: 'Dossier', description: 'Dossier thématique' },
    { key: 'evergreen_guide', label: 'Guide', description: 'Guide de jeu' },
    { key: 'preview', label: 'Preview', description: 'Avant-première' },
  ],
  affiliate_guides: [
    { key: 'evergreen_guide', label: 'Guide', description: 'Guide d\'achat' },
    { key: 'review_test', label: 'Test produit', description: 'Test détaillé produit' },
    { key: 'comparison', label: 'Comparatif', description: 'Comparaison de produits' },
    { key: 'news', label: 'Bons plans', description: 'Actualité promotions' },
    { key: 'tutorial', label: 'Tutoriel', description: 'Tutoriel pratique' },
  ],
  lifestyle: [
    { key: 'feature_dossier', label: 'Article', description: 'Article lifestyle' },
    { key: 'evergreen_guide', label: 'Guide', description: 'Guide pratique' },
    { key: 'review_test', label: 'Avis', description: 'Avis produit/service' },
    { key: 'interview', label: 'Portrait', description: 'Portrait/Interview' },
    { key: 'news', label: 'Tendances', description: 'Actualité tendances' },
  ],
};

/**
 * Get base rules template
 */
function getBaseRules(): ContentTypeRules {
  return {
    format: 'html',
    allowed_tags: ['h2', 'p', 'b', 'i', 'ul', 'li'],
    constraints: {
      no_emojis: true,
      no_em_dash: true,
      no_generic_conclusion: true,
      max_lists: 1,
      min_list_items: 2,
      min_paragraphs_per_h2: 2,
    },
    length: {
      min_words: 800,
      target_words: 1200,
    },
    structure: {
      required_sections: ['intro'],
      h2_count_target: 4,
    },
    defaults: {
      preferred_author_role_keys: [],
    },
  };
}

/**
 * Customize rules for specific content type
 */
function customizeRulesForType(key: string): ContentTypeRules {
  const baseRules = getBaseRules();

  switch (key) {
    case 'news':
      return {
        ...baseRules,
        length: {
          min_words: 400,
          target_words: 700,
        },
        structure: {
          ...baseRules.structure,
          h2_count_target: 2,
        },
        defaults: {
          preferred_author_role_keys: ['news_writer'],
        },
      };

    case 'review_test':
      return {
        ...baseRules,
        length: {
          min_words: 900,
          target_words: 1400,
        },
        structure: {
          ...baseRules.structure,
          h2_count_target: 4,
        },
        defaults: {
          preferred_author_role_keys: ['specialist_gaming', 'specialist_anime_manga'],
        },
      };

    case 'feature_dossier':
      return {
        ...baseRules,
        length: {
          min_words: 1200,
          target_words: 1700,
        },
        structure: {
          ...baseRules.structure,
          h2_count_target: 5,
        },
        defaults: {
          preferred_author_role_keys: ['editorial_lead', 'specialist_culture'],
        },
      };

    case 'evergreen_guide':
      return {
        ...baseRules,
        length: {
          min_words: 1200,
          target_words: 1800,
        },
        structure: {
          ...baseRules.structure,
          h2_count_target: 5,
        },
        defaults: {
          preferred_author_role_keys: ['editorial_lead', 'specialist_anime_manga', 'specialist_gaming'],
        },
      };

    case 'interview':
    case 'analysis':
    case 'investigation':
    case 'preview':
    case 'comparison':
    case 'tutorial':
    case 'opinion':
      // Keep base rules for other types
      return baseRules;

    default:
      return baseRules;
  }
}

/**
 * Build deterministic content types plan
 */
export function buildContentTypesPlan(args: {
  siteType: string;
  profile: SiteDecisionProfile;
}): ContentTypePlan[] {
  const { siteType, profile } = args;

  // 1. Calculate default count
  const defaultCount = Math.round((profile.targets.contentTypes.min + profile.targets.contentTypes.max) / 2);

  // 2. Apply bootstrap cap
  const cap = CONTENT_TYPE_CAP_BY_SIZE[profile.siteSize] || 4;
  const finalCount = Math.min(defaultCount, cap);

  // 3. Get candidates for site type
  const candidates = CONTENT_TYPE_CANDIDATES[siteType] || CONTENT_TYPE_CANDIDATES['niche_passion'];

  // 4. Select first finalCount candidates
  const selectedTypes = candidates.slice(0, finalCount);

  // 5. Build plan with customized rules
  return selectedTypes.map(type => ({
    key: type.key,
    label: type.label,
    description: type.description,
    rulesJson: customizeRulesForType(type.key),
  }));
}

/**
 * Filter plan to only include types that don't exist yet
 */
export function filterMissingContentTypes(
  plan: ContentTypePlan[],
  existingKeys: string[]
): ContentTypePlan[] {
  return plan.filter(type => !existingKeys.includes(type.key));
}
