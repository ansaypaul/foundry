import { 
  SiteDecisionProfile, 
  SiteSize, 
  EditorialComplexity, 
  PublishingVelocity,
  DecisionEngineInput 
} from './types';

// Weights for site types
const SITE_TYPE_WEIGHTS: Record<string, number> = {
  niche_passion: 1,
  lifestyle: 1,
  affiliate_guides: 2,
  gaming_popculture: 2,
  news_media: 3,
};

// Weights for automation levels
const AUTOMATION_WEIGHTS: Record<string, number> = {
  manual: 0,
  ai_assisted: 1,
  ai_auto: 2,
};

// Weights for ambition levels
const AMBITION_WEIGHTS: Record<string, number> = {
  starter: 0,
  growth: 1,
  factory: 2,
};

// Targets table by size
const TARGETS_BY_SIZE: Record<SiteSize, {
  authors: { min: number; max: number };
  categories: { min: number; max: number };
  contentTypes: { min: number; max: number };
  mandatoryPages: { min: number; max: number };
}> = {
  small: {
    authors: { min: 1, max: 2 },
    categories: { min: 3, max: 5 },
    contentTypes: { min: 2, max: 3 },
    mandatoryPages: { min: 4, max: 5 },
  },
  medium: {
    authors: { min: 3, max: 5 },
    categories: { min: 6, max: 10 },
    contentTypes: { min: 4, max: 5 },
    mandatoryPages: { min: 5, max: 6 },
  },
  large: {
    authors: { min: 6, max: 10 },
    categories: { min: 10, max: 20 },
    contentTypes: { min: 6, max: 8 },
    mandatoryPages: { min: 6, max: 8 },
  },
};

export function computeSiteDecisionProfile(input: DecisionEngineInput): SiteDecisionProfile {
  const rationale: string[] = [];

  // 1. Resolve ambition level
  let resolvedAmbition = input.ambitionLevel || 'auto';
  
  if (resolvedAmbition === 'auto') {
    if (input.automationLevel === 'ai_auto') {
      resolvedAmbition = 'growth';
      rationale.push(`ambitionLevel=auto substituted to 'growth' (ai_auto detected)`);
    } else {
      resolvedAmbition = 'starter';
      rationale.push(`ambitionLevel=auto substituted to 'starter' (default)`);
    }
  }

  // 2. Get weights
  const siteTypeWeight = SITE_TYPE_WEIGHTS[input.siteType] || 1;
  const automationWeight = AUTOMATION_WEIGHTS[input.automationLevel] || 0;
  const ambitionWeight = AMBITION_WEIGHTS[resolvedAmbition] || 0;

  rationale.push(`siteTypeWeight=${siteTypeWeight} (${input.siteType})`);
  rationale.push(`automationWeight=${automationWeight} (${input.automationLevel})`);
  rationale.push(`ambitionWeight=${ambitionWeight} (${resolvedAmbition})`);

  // 3. Calculate score
  const score = siteTypeWeight + automationWeight + ambitionWeight;

  // 4. Map score to size/complexity/velocity
  let siteSize: SiteSize;
  let complexity: EditorialComplexity;
  let velocity: PublishingVelocity;

  if (score <= 2) {
    siteSize = 'small';
    complexity = 1;
    velocity = 'low';
  } else if (score <= 4) {
    siteSize = 'medium';
    complexity = 2;
    velocity = 'medium';
  } else {
    siteSize = 'large';
    complexity = 3;
    velocity = 'high';
  }

  rationale.push(`score=${score} => siteSize=${siteSize}, complexity=${complexity}, velocity=${velocity}`);

  // 5. Get targets from table
  const targets = TARGETS_BY_SIZE[siteSize];
  rationale.push(`Applied ${siteSize} targets table`);

  return {
    siteSize,
    complexity,
    velocity,
    targets,
    rationale,
  };
}
