/**
 * SEO Core - Analyzer
 * Analyse SEO basique et calcul du score (0-100)
 * Inspiré de Rank Math mais simplifié
 */

import type { Content } from '@/lib/db/types';
import {
  validateTitleLength,
  validateDescriptionLength,
  calculateKeywordDensity,
  containsKeyword,
  stripHtml,
  sanitize,
} from './utils';
import { SEO_LIMITS } from './config';

// ===================================
// TYPES
// ===================================

export interface SeoAnalysisResult {
  score: number; // 0-100
  checks: SeoCheck[];
  warnings: string[];
  recommendations: string[];
}

export interface SeoCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  score: number; // Points attribués
  maxScore: number; // Points maximum
  message?: string;
}

// ===================================
// MAIN ANALYZER
// ===================================

/**
 * Analyse SEO complète d'un contenu
 * Retourne un score sur 100 et des recommandations
 */
export function analyzeSeo(content: Content): SeoAnalysisResult {
  const checks: SeoCheck[] = [];
  
  // 1. Title checks (20 points)
  checks.push(checkTitle(content));
  
  // 2. Description checks (15 points)
  checks.push(checkDescription(content));
  
  // 3. Content checks (25 points)
  checks.push(checkContentLength(content));
  checks.push(checkH1(content));
  
  // 4. Keyword checks (20 points)
  if (content.seo_focus_keyword) {
    checks.push(checkKeywordInTitle(content));
    checks.push(checkKeywordInDescription(content));
    checks.push(checkKeywordDensity(content));
  }
  
  // 5. Media checks (10 points)
  checks.push(checkFeaturedImage(content));
  checks.push(checkImagesAlt(content));
  
  // 6. Meta checks (10 points)
  checks.push(checkCanonical(content));
  checks.push(checkRobots(content));
  
  // Calculate total score
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const totalMaxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  const score = Math.round((totalScore / totalMaxScore) * 100);
  
  // Generate warnings and recommendations
  const warnings = checks
    .filter((c) => c.status === 'warning')
    .map((c) => c.message || c.label);
  
  const recommendations = checks
    .filter((c) => c.status === 'fail')
    .map((c) => c.message || c.label);
  
  return {
    score,
    checks,
    warnings,
    recommendations,
  };
}

// ===================================
// INDIVIDUAL CHECKS
// ===================================

/**
 * Check 1: Titre SEO
 */
function checkTitle(content: Content): SeoCheck {
  const title = content.seo_title || content.title;
  const validation = validateTitleLength(title);
  
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let score = 20;
  let message = `Titre: ${validation.length} caractères`;
  
  if (validation.status === 'too_short') {
    status = 'fail';
    score = 5;
    message = `Titre trop court (${validation.length} car.). Recommandé: ${SEO_LIMITS.TITLE_MIN}-${SEO_LIMITS.TITLE_MAX}`;
  } else if (validation.status === 'too_long') {
    status = 'warning';
    score = 15;
    message = `Titre trop long (${validation.length} car.). Sera tronqué dans les résultats Google.`;
  } else if (validation.status === 'acceptable') {
    status = 'pass';
    score = 18;
  }
  
  return {
    id: 'title_length',
    label: 'Longueur du titre SEO',
    status,
    score,
    maxScore: 20,
    message,
  };
}

/**
 * Check 2: Meta description
 */
function checkDescription(content: Content): SeoCheck {
  const description = content.seo_description || content.excerpt || '';
  
  if (!description) {
    return {
      id: 'description_exists',
      label: 'Meta description',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Aucune meta description définie',
    };
  }
  
  const validation = validateDescriptionLength(description);
  
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let score = 15;
  let message = `Description: ${validation.length} caractères`;
  
  if (validation.status === 'too_short') {
    status = 'fail';
    score = 5;
    message = `Description trop courte (${validation.length} car.). Recommandé: ${SEO_LIMITS.DESCRIPTION_MIN}-${SEO_LIMITS.DESCRIPTION_MAX}`;
  } else if (validation.status === 'too_long') {
    status = 'warning';
    score = 12;
    message = `Description trop longue (${validation.length} car.). Sera tronquée.`;
  } else if (validation.status === 'acceptable') {
    status = 'pass';
    score = 13;
  }
  
  return {
    id: 'description_length',
    label: 'Meta description',
    status,
    score,
    maxScore: 15,
    message,
  };
}

/**
 * Check 3: Longueur du contenu
 */
function checkContentLength(content: Content): SeoCheck {
  const text = stripHtml(content.content_html || '');
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let score = 10;
  let message = `Contenu: ${words} mots`;
  
  if (words < 300) {
    status = 'fail';
    score = 0;
    message = `Contenu trop court (${words} mots). Recommandé: 300+ mots pour un bon SEO.`;
  } else if (words < 500) {
    status = 'warning';
    score = 7;
    message = `Contenu acceptable (${words} mots). Idéal: 500+ mots.`;
  } else {
    status = 'pass';
    score = 10;
  }
  
  return {
    id: 'content_length',
    label: 'Longueur du contenu',
    status,
    score,
    maxScore: 10,
    message,
  };
}

/**
 * Check 4: Présence H1
 */
function checkH1(content: Content): SeoCheck {
  const html = content.content_html || '';
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  
  if (!h1Match) {
    return {
      id: 'h1_exists',
      label: 'Titre H1',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Aucun H1 trouvé dans le contenu',
    };
  }
  
  const h1Text = stripHtml(h1Match[1]);
  
  // Check if H1 is similar to title
  const titleWords = sanitize(content.title).toLowerCase().split(/\s+/);
  const h1Words = h1Text.toLowerCase().split(/\s+/);
  const commonWords = titleWords.filter((word) => h1Words.includes(word));
  const similarity = commonWords.length / Math.max(titleWords.length, h1Words.length);
  
  if (similarity > 0.6) {
    return {
      id: 'h1_exists',
      label: 'Titre H1',
      status: 'pass',
      score: 15,
      maxScore: 15,
      message: 'H1 présent et cohérent avec le titre',
    };
  }
  
  return {
    id: 'h1_exists',
    label: 'Titre H1',
    status: 'warning',
    score: 10,
    maxScore: 15,
    message: 'H1 présent mais différent du titre',
  };
}

/**
 * Check 5: Mot-clé dans le titre
 */
function checkKeywordInTitle(content: Content): SeoCheck {
  if (!content.seo_focus_keyword) {
    return {
      id: 'keyword_in_title',
      label: 'Mot-clé dans le titre',
      status: 'warning',
      score: 0,
      maxScore: 8,
      message: 'Aucun mot-clé principal défini',
    };
  }
  
  const title = content.seo_title || content.title;
  const hasKeyword = containsKeyword(title, content.seo_focus_keyword);
  
  return {
    id: 'keyword_in_title',
    label: 'Mot-clé dans le titre',
    status: hasKeyword ? 'pass' : 'fail',
    score: hasKeyword ? 8 : 0,
    maxScore: 8,
    message: hasKeyword
      ? 'Mot-clé principal présent dans le titre'
      : `Mot-clé "${content.seo_focus_keyword}" absent du titre`,
  };
}

/**
 * Check 6: Mot-clé dans la description
 */
function checkKeywordInDescription(content: Content): SeoCheck {
  if (!content.seo_focus_keyword) {
    return {
      id: 'keyword_in_description',
      label: 'Mot-clé dans la description',
      status: 'warning',
      score: 0,
      maxScore: 6,
    };
  }
  
  const description = content.seo_description || content.excerpt || '';
  const hasKeyword = containsKeyword(description, content.seo_focus_keyword);
  
  return {
    id: 'keyword_in_description',
    label: 'Mot-clé dans la description',
    status: hasKeyword ? 'pass' : 'warning',
    score: hasKeyword ? 6 : 0,
    maxScore: 6,
    message: hasKeyword
      ? 'Mot-clé principal présent dans la description'
      : 'Mot-clé absent de la description',
  };
}

/**
 * Check 7: Densité du mot-clé
 */
function checkKeywordDensity(content: Content): SeoCheck {
  if (!content.seo_focus_keyword) {
    return {
      id: 'keyword_density',
      label: 'Densité du mot-clé',
      status: 'warning',
      score: 0,
      maxScore: 6,
    };
  }
  
  const text = stripHtml(content.content_html || '');
  const density = calculateKeywordDensity(text, content.seo_focus_keyword);
  
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let score = 6;
  let message = `Densité: ${density.toFixed(2)}%`;
  
  if (density < SEO_LIMITS.FOCUS_KEYWORD_MIN_DENSITY) {
    status = 'warning';
    score = 3;
    message = `Densité trop faible (${density.toFixed(2)}%). Recommandé: ${SEO_LIMITS.FOCUS_KEYWORD_MIN_DENSITY}-${SEO_LIMITS.FOCUS_KEYWORD_MAX_DENSITY}%`;
  } else if (density > SEO_LIMITS.FOCUS_KEYWORD_MAX_DENSITY) {
    status = 'warning';
    score = 3;
    message = `Densité trop élevée (${density.toFixed(2)}%). Risque de sur-optimisation.`;
  }
  
  return {
    id: 'keyword_density',
    label: 'Densité du mot-clé',
    status,
    score,
    maxScore: 6,
    message,
  };
}

/**
 * Check 8: Image à la une
 */
function checkFeaturedImage(content: Content): SeoCheck {
  const hasFeaturedImage = !!content.featured_media_id;
  
  return {
    id: 'featured_image',
    label: 'Image à la une',
    status: hasFeaturedImage ? 'pass' : 'warning',
    score: hasFeaturedImage ? 5 : 0,
    maxScore: 5,
    message: hasFeaturedImage
      ? 'Image à la une définie'
      : 'Aucune image à la une (recommandé pour réseaux sociaux)',
  };
}

/**
 * Check 9: Images avec alt text
 */
function checkImagesAlt(content: Content): SeoCheck {
  const html = content.content_html || '';
  const images = html.match(/<img[^>]*>/gi) || [];
  
  if (images.length === 0) {
    return {
      id: 'images_alt',
      label: 'Images avec texte alternatif',
      status: 'pass',
      score: 5,
      maxScore: 5,
      message: 'Aucune image dans le contenu',
    };
  }
  
  const imagesWithoutAlt = images.filter((img) => !img.includes('alt='));
  const percentage = ((images.length - imagesWithoutAlt.length) / images.length) * 100;
  
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  let score = 5;
  
  if (percentage < 50) {
    status = 'fail';
    score = 0;
  } else if (percentage < 100) {
    status = 'warning';
    score = 3;
  }
  
  return {
    id: 'images_alt',
    label: 'Images avec texte alternatif',
    status,
    score,
    maxScore: 5,
    message: `${Math.round(percentage)}% des images ont un texte alternatif (${images.length - imagesWithoutAlt.length}/${images.length})`,
  };
}

/**
 * Check 10: URL canonique
 */
function checkCanonical(content: Content): SeoCheck {
  // Canonical is auto-generated if not set, so this is mostly informational
  return {
    id: 'canonical',
    label: 'URL canonique',
    status: 'pass',
    score: 5,
    maxScore: 5,
    message: content.seo_canonical
      ? 'URL canonique personnalisée définie'
      : 'URL canonique auto-générée',
  };
}

/**
 * Check 11: Directives robots
 */
function checkRobots(content: Content): SeoCheck {
  const isIndexed = content.seo_robots_index ?? true;
  const isFollowed = content.seo_robots_follow ?? true;
  
  if (!isIndexed) {
    return {
      id: 'robots',
      label: 'Indexation',
      status: 'warning',
      score: 0,
      maxScore: 5,
      message: 'Page en noindex (non indexée par les moteurs de recherche)',
    };
  }
  
  return {
    id: 'robots',
    label: 'Indexation',
    status: 'pass',
    score: 5,
    maxScore: 5,
    message: isFollowed
      ? 'Page indexable et liens suivis'
      : 'Page indexable mais liens non suivis (nofollow)',
  };
}
