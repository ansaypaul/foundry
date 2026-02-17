import { z } from 'zod';

// ====================================
// Blueprint Template Schema v1
// ====================================

export const BlueprintCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  intent: z.enum(['news', 'guides', 'recipes', 'reviews', 'culture', 'tips', 'shopping', 'other']),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const BlueprintAuthorSchema = z.object({
  roleKey: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  specialties: z.array(z.string()).min(1),
  isAi: z.boolean(),
});

export const BlueprintPageSchema = z.object({
  key: z.enum(['about', 'contact', 'legal', 'privacy', 'terms']),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  status: z.literal('draft'),
});

// BlueprintContentTypeSchema removed - content types now managed via editorial_content_types table

export const BlueprintSeoDefaultsSchema = z.object({
  contentTitleTemplate: z.string(),
  termTitleTemplate: z.string(),
  descriptionStrategy: z.string(),
  ogTypeDefault: z.string(),
  robotsDefault: z.object({
    index: z.boolean(),
    follow: z.boolean(),
  }),
});

export const BlueprintTemplateV1Schema = z.object({
  version: z.literal(1),
  site: z.object({
    name: z.string(),
    language: z.string(),
    country: z.string(),
    siteType: z.string(),
    ambitionLevel: z.string(),
    automationLevel: z.string(),
    nicheSummary: z.string().min(10).max(500),
  }),
  taxonomy: z.object({
    categories: z.array(BlueprintCategorySchema).min(2).max(20),
  }),
  authors: z.array(BlueprintAuthorSchema).min(2).max(10),
  pages: z.array(BlueprintPageSchema).min(5).max(5), // Always 5 mandatory pages
  // contentTypes removed - now managed via editorial_content_types table
  seoDefaults: BlueprintSeoDefaultsSchema,
});

export type BlueprintTemplateV1 = z.infer<typeof BlueprintTemplateV1Schema>;
export type BlueprintCategory = z.infer<typeof BlueprintCategorySchema>;
export type BlueprintAuthor = z.infer<typeof BlueprintAuthorSchema>;
export type BlueprintPage = z.infer<typeof BlueprintPageSchema>;
// BlueprintContentType removed - use editorial_content_types table instead
export type BlueprintSeoDefaults = z.infer<typeof BlueprintSeoDefaultsSchema>;

/**
 * Validate and parse a blueprint template
 */
export function validateBlueprintTemplate(data: unknown): { 
  valid: boolean; 
  template?: BlueprintTemplateV1; 
  errors?: string[] 
} {
  try {
    const template = BlueprintTemplateV1Schema.parse(data);
    return { valid: true, template };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Get counts constraints based on ambition level
 */
/**
 * Get counts constraints based on ambition level
 * Note: contentTypes constraints removed - content types now managed via editorial_content_types table
 */
export function getBlueprintConstraints(ambitionLevel: string): {
  categories: { min: number; max: number };
  authors: { min: number; max: number };
} {
  switch (ambitionLevel) {
    case 'starter':
      return {
        categories: { min: 4, max: 6 },
        authors: { min: 2, max: 3 },
      };
    case 'growth':
      return {
        categories: { min: 6, max: 10 },
        authors: { min: 3, max: 5 },
      };
    case 'factory':
      return {
        categories: { min: 10, max: 16 },
        authors: { min: 5, max: 8 },
      };
    default: // 'auto'
      return {
        categories: { min: 5, max: 8 },
        authors: { min: 3, max: 4 },
      };
  }
}
