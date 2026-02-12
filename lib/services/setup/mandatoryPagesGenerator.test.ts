import { buildMandatoryPagesPlan, filterMissingPages } from './mandatoryPagesGenerator';

describe('Mandatory Pages Generator', () => {
  describe('buildMandatoryPagesPlan', () => {
    test('FR + medium => 5 pages with correct slugs', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'TestSite',
        siteSize: 'medium',
        language: 'fr',
        country: 'FR',
      });

      expect(plan.length).toBe(5);
      
      // Check all pages
      expect(plan[0].type).toBe('about');
      expect(plan[0].title).toBe('À propos');
      expect(plan[0].slug).toBe('a-propos');
      
      expect(plan[1].type).toBe('contact');
      expect(plan[1].slug).toBe('contact');
      
      expect(plan[2].type).toBe('legal');
      expect(plan[2].slug).toBe('mentions-legales');
      
      expect(plan[3].type).toBe('privacy');
      expect(plan[3].slug).toBe('politique-de-confidentialite');
      
      expect(plan[4].type).toBe('cgu');
      expect(plan[4].slug).toBe('conditions-generales');
      
      // Should NOT include editorial charter
      expect(plan.some(p => p.type === 'editorial_charter')).toBe(false);
    });

    test('FR + large => 6 pages including editorial charter', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'LargeSite',
        siteSize: 'large',
        language: 'fr',
        country: 'FR',
      });

      expect(plan.length).toBe(6);
      expect(plan[5].type).toBe('editorial_charter');
      expect(plan[5].title).toBe('Charte éditoriale');
      expect(plan[5].slug).toBe('charte-editoriale');
    });

    test('FR + small => 4 pages', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'SmallSite',
        siteSize: 'small',
        language: 'fr',
        country: 'FR',
      });

      expect(plan.length).toBe(4);
      expect(plan[0].type).toBe('about');
      expect(plan[3].type).toBe('privacy');
    });

    test('EN + medium => 5 pages with English titles', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'EnglishSite',
        siteSize: 'medium',
        language: 'en',
        country: 'US',
      });

      expect(plan.length).toBe(5);
      expect(plan[0].title).toBe('About');
      expect(plan[0].slug).toBe('about');
      expect(plan[2].title).toBe('Legal Notice');
      expect(plan[3].title).toBe('Privacy Policy');
    });

    test('all pages have required fields and content', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'TestSite',
        siteSize: 'medium',
        language: 'fr',
        country: 'FR',
      });

      plan.forEach(page => {
        expect(page.type).toBeTruthy();
        expect(page.title).toBeTruthy();
        expect(page.slug).toBeTruthy();
        expect(page.contentHtml).toBeTruthy();
        expect(page.contentHtml).toContain('<p>');
      });
    });

    test('French content has correct placeholder text', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'TestSite',
        siteSize: 'small',
        language: 'fr',
        country: 'FR',
      });

      expect(plan[0].contentHtml).toContain('Cette page est en cours de configuration');
      expect(plan[0].contentHtml).toContain('prochainement');
    });

    test('English content has correct placeholder text', () => {
      const plan = buildMandatoryPagesPlan({
        siteName: 'TestSite',
        siteSize: 'small',
        language: 'en',
        country: 'US',
      });

      expect(plan[0].contentHtml).toContain('This page is being configured');
      expect(plan[0].contentHtml).toContain('soon');
    });
  });

  describe('filterMissingPages', () => {
    test('removes existing pages from plan', () => {
      const plan = [
        { type: 'about', title: 'About', slug: 'about', contentHtml: '<p>Test</p>' },
        { type: 'contact', title: 'Contact', slug: 'contact', contentHtml: '<p>Test</p>' },
        { type: 'legal', title: 'Legal', slug: 'legal', contentHtml: '<p>Test</p>' },
      ];

      const existing = ['about'];
      const missing = filterMissingPages(plan, existing);

      expect(missing.length).toBe(2);
      expect(missing.some(p => p.type === 'about')).toBe(false);
      expect(missing.some(p => p.type === 'contact')).toBe(true);
    });

    test('returns empty if all exist', () => {
      const plan = [
        { type: 'about', title: 'About', slug: 'about', contentHtml: '<p>Test</p>' },
      ];

      const existing = ['about'];
      const missing = filterMissingPages(plan, existing);

      expect(missing.length).toBe(0);
    });
  });
});
