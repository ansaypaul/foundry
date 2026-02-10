/**
 * SEO Core - Main Export
 * Point d'entrée principal du module SEO de Foundry
 */

// Configuration & Types
export * from './config';

// Utilities
export * from './utils';

// Database Queries
export * from './queries';

// SEO Resolver (core logic)
export { resolveSeoMeta } from './resolver';

// Meta Tags Generator
export {
  generateMetadata,
  generateMetaTags,
  generateSchemaScripts,
  generateAllSeoTags,
  toHeadProps,
  type HeadProps,
} from './meta';

// SEO Analyzer
export {
  analyzeSeo,
  type SeoAnalysisResult,
  type SeoCheck,
} from './analyzer';
