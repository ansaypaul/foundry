import { SiteSize } from '@/lib/core/decisionEngine/types';

export interface MandatoryPagePlan {
  type: string;
  title: string;
  slug: string;
  contentHtml: string;
}

// Page templates by language
const PAGE_TEMPLATES_FR = [
  {
    type: 'about',
    title: 'À propos',
    slug: 'a-propos',
  },
  {
    type: 'contact',
    title: 'Contact',
    slug: 'contact',
  },
  {
    type: 'legal',
    title: 'Mentions légales',
    slug: 'mentions-legales',
  },
  {
    type: 'privacy',
    title: 'Politique de confidentialité',
    slug: 'politique-de-confidentialite',
  },
  {
    type: 'cgu',
    title: "Conditions générales d'utilisation",
    slug: 'conditions-generales',
  },
  {
    type: 'editorial_charter',
    title: 'Charte éditoriale',
    slug: 'charte-editoriale',
  },
];

const PAGE_TEMPLATES_EN = [
  {
    type: 'about',
    title: 'About',
    slug: 'about',
  },
  {
    type: 'contact',
    title: 'Contact',
    slug: 'contact',
  },
  {
    type: 'legal',
    title: 'Legal Notice',
    slug: 'legal-notice',
  },
  {
    type: 'privacy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
  },
  {
    type: 'cgu',
    title: 'Terms of Use',
    slug: 'terms-of-use',
  },
  {
    type: 'editorial_charter',
    title: 'Editorial Charter',
    slug: 'editorial-charter',
  },
];

/**
 * Get placeholder content HTML
 */
function getPlaceholderContent(language: string): string {
  if (language === 'fr') {
    return `<p>Cette page est en cours de configuration.</p>
<p>Son contenu sera complété prochainement.</p>`;
  }
  
  return `<p>This page is being configured.</p>
<p>Content will be added soon.</p>`;
}

/**
 * Build deterministic mandatory pages plan
 */
export function buildMandatoryPagesPlan(args: {
  siteName: string;
  siteSize: SiteSize;
  language: string;
  country: string;
}): MandatoryPagePlan[] {
  const { siteSize, language } = args;

  // Get template based on language
  const template = language === 'fr' ? PAGE_TEMPLATES_FR : PAGE_TEMPLATES_EN;
  
  // Determine count based on size
  let count: number;
  if (siteSize === 'small') {
    count = 4; // Basic pages only
  } else if (siteSize === 'medium') {
    count = 5; // All standard pages
  } else {
    count = 6; // Include editorial charter
  }

  // Select pages
  const selectedPages = template.slice(0, count);
  
  // Build plan with content
  const contentHtml = getPlaceholderContent(language);
  
  return selectedPages.map(page => ({
    type: page.type,
    title: page.title,
    slug: page.slug,
    contentHtml,
  }));
}

/**
 * Filter plan to only include pages that don't exist yet
 */
export function filterMissingPages(
  plan: MandatoryPagePlan[],
  existingTypes: string[]
): MandatoryPagePlan[] {
  return plan.filter(page => !existingTypes.includes(page.type));
}
