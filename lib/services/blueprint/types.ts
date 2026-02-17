import { z } from 'zod';

// Blueprint schema v1
export const BlueprintAuthorSchema = z.object({
  roleKey: z.string(),
  displayName: z.string(),
  specialties: z.array(z.string()),
  isAi: z.boolean(),
  status: z.string(),
});

export const BlueprintCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  parentSlug: z.string().nullable(),
  order: z.number(),
  status: z.string(),
});

export const BlueprintPageSchema = z.object({
  type: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.string(),
});

// BlueprintContentTypeSchema removed - content types now managed via editorial_content_types table

export const BlueprintSeoDefaultsSchema = z.object({
  contentTitleTemplate: z.string(),
  termTitleTemplate: z.string(),
  descriptionStrategy: z.string(),
  defaultOgImage: z.string().nullable(),
  defaultOgType: z.string(),
  robotsDefault: z.object({
    index: z.boolean(),
    follow: z.boolean(),
  }),
});

export const BlueprintSeoBootstrapSchema = z.object({
  applied: z.boolean(),
  stats: z.object({
    contentSeoCount: z.number(),
    termSeoCount: z.number(),
    siteSeoExists: z.boolean(),
  }),
});

export const BlueprintV1Schema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  
  site: z.object({
    id: z.string(),
    name: z.string(),
    language: z.string(),
    country: z.string(),
    siteType: z.string(),
    automationLevel: z.string(),
    ambitionLevel: z.string().nullable(),
    description: z.string().nullable(),
  }),
  
  decisionProfile: z.object({
    siteSize: z.enum(['small', 'medium', 'large']),
    complexity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    velocity: z.enum(['low', 'medium', 'high']),
    targets: z.object({
      authors: z.object({ min: z.number(), max: z.number() }),
      categories: z.object({ min: z.number(), max: z.number() }),
      contentTypes: z.object({ min: z.number(), max: z.number() }),
      mandatoryPages: z.object({ min: z.number(), max: z.number() }),
    }),
  }),
  
  authors: z.array(BlueprintAuthorSchema),
  
  taxonomy: z.object({
    categories: z.array(BlueprintCategorySchema),
  }),
  
  pages: z.array(BlueprintPageSchema),
  
  // contentTypes removed - now managed via editorial_content_types table
  
  seoDefaults: BlueprintSeoDefaultsSchema,
  
  seoBootstrap: BlueprintSeoBootstrapSchema,
});

export type BlueprintV1 = z.infer<typeof BlueprintV1Schema>;
export type BlueprintSeoDefaults = z.infer<typeof BlueprintSeoDefaultsSchema>;
export type BlueprintSeoBootstrap = z.infer<typeof BlueprintSeoBootstrapSchema>;
export type BlueprintAuthor = z.infer<typeof BlueprintAuthorSchema>;
export type BlueprintCategory = z.infer<typeof BlueprintCategorySchema>;
export type BlueprintPage = z.infer<typeof BlueprintPageSchema>;
// BlueprintContentType removed - use editorial_content_types table instead
