export type SiteSize = "small" | "medium" | "large";
export type PublishingVelocity = "low" | "medium" | "high";
export type EditorialComplexity = 1 | 2 | 3;

export interface SiteDecisionProfile {
  siteSize: SiteSize;
  complexity: EditorialComplexity;
  velocity: PublishingVelocity;

  targets: {
    authors: { min: number; max: number };
    categories: { min: number; max: number };
    contentTypes: { min: number; max: number };
    mandatoryPages: { min: number; max: number };
  };

  rationale: string[];
}

export interface DecisionEngineInput {
  siteType: string;
  automationLevel: string;
  ambitionLevel?: string;
  description?: string | null;
  language: string;
  country: string;
}
