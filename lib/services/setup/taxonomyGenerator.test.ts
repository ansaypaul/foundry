import { buildCategoryPlan, slugifyCategory, filterMissingCategories } from './taxonomyGenerator';
import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

describe('Taxonomy Generator', () => {
  describe('slugifyCategory', () => {
    test('handles accents and special chars', () => {
      expect(slugifyCategory('Critiques & Tests')).toBe('critiques-et-tests');
      expect(slugifyCategory('Économie')).toBe('economie');
      expect(slugifyCategory('Culture japonaise')).toBe('culture-japonaise');
      expect(slugifyCategory('Tests & Reviews')).toBe('tests-et-reviews');
    });

    test('removes multiple spaces and special chars', () => {
      expect(slugifyCategory('Mode & Style')).toBe('mode-et-style');
      expect(slugifyCategory('Streaming & Plateformes')).toBe('streaming-et-plateformes');
    });
  });

  describe('buildCategoryPlan', () => {
    test('niche_passion + medium (6-10) => 8 categories (exactly at cap)', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'medium',
        complexity: 2,
        velocity: 'medium',
        targets: {
          authors: { min: 3, max: 5 },
          categories: { min: 6, max: 10 },
          contentTypes: { min: 4, max: 5 },
          mandatoryPages: { min: 5, max: 6 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'niche_passion',
        profile,
      });

      // (6+10)/2 = 8, matches medium cap of 8
      expect(plan.length).toBe(8);
      
      // Check first categories match template order
      expect(plan[0].name).toBe('Anime');
      expect(plan[0].slug).toBe('anime');
      expect(plan[1].name).toBe('Manga');
      expect(plan[2].name).toBe('Jeux vidéo');
      expect(plan[3].name).toBe('Actualité');
      expect(plan[4].name).toBe('Critiques & Tests');
      expect(plan[4].slug).toBe('critiques-et-tests');
      
      // Check order field
      expect(plan[0].order).toBe(0);
      expect(plan[7].order).toBe(7);
    });

    test('small site (3-5) => 4 categories', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'small',
        complexity: 1,
        velocity: 'low',
        targets: {
          authors: { min: 1, max: 2 },
          categories: { min: 3, max: 5 },
          contentTypes: { min: 2, max: 3 },
          mandatoryPages: { min: 4, max: 5 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'niche_passion',
        profile,
      });

      expect(plan.length).toBe(4);
      expect(plan[0].name).toBe('Anime');
      expect(plan[3].name).toBe('Actualité');
    });

    test('large site (10-20) => 10 categories (capped)', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'large',
        complexity: 3,
        velocity: 'high',
        targets: {
          authors: { min: 6, max: 10 },
          categories: { min: 10, max: 20 },
          contentTypes: { min: 6, max: 8 },
          mandatoryPages: { min: 6, max: 8 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'news_media',
        profile,
      });

      // (10+20)/2 = 15, but capped at 10 for large sites
      expect(plan.length).toBe(10);
      expect(plan[0].name).toBe('Actualité');
      expect(plan[9].name).toBe('Opinion');
    });

    test('keyword swap: description contains "musique" => replaces last category', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'medium',
        complexity: 2,
        velocity: 'medium',
        targets: {
          authors: { min: 3, max: 5 },
          categories: { min: 6, max: 10 },
          contentTypes: { min: 4, max: 5 },
          mandatoryPages: { min: 5, max: 6 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'niche_passion',
        description: 'Site dédié à la musique japonaise et aux animes',
        profile,
      });

      expect(plan.length).toBe(8);
      // Last category should be replaced with "Musique"
      expect(plan[7].name).toBe('Musique');
      expect(plan[7].slug).toBe('musique');
    });

    test('keyword swap: description contains "voyage"', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'small',
        complexity: 1,
        velocity: 'low',
        targets: {
          authors: { min: 1, max: 2 },
          categories: { min: 3, max: 5 },
          contentTypes: { min: 2, max: 3 },
          mandatoryPages: { min: 4, max: 5 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'niche_passion',
        description: 'Guide de voyage au Japon et culture',
        profile,
      });

      expect(plan.length).toBe(4);
      expect(plan[3].name).toBe('Voyage');
    });

    test('all categories have required fields', () => {
      const profile: SiteDecisionProfile = {
        siteSize: 'medium',
        complexity: 2,
        velocity: 'medium',
        targets: {
          authors: { min: 3, max: 5 },
          categories: { min: 6, max: 10 },
          contentTypes: { min: 4, max: 5 },
          mandatoryPages: { min: 5, max: 6 },
        },
        rationale: [],
      };

      const plan = buildCategoryPlan({
        siteType: 'gaming_popculture',
        profile,
      });

      plan.forEach(cat => {
        expect(cat.name).toBeTruthy();
        expect(cat.slug).toBeTruthy();
        expect(typeof cat.order).toBe('number');
        expect(cat.parentSlug).toBeNull();
      });
    });
  });

  describe('filterMissingCategories', () => {
    test('removes existing categories from plan', () => {
      const plan = [
        { name: 'Anime', slug: 'anime', parentSlug: null, order: 0 },
        { name: 'Manga', slug: 'manga', parentSlug: null, order: 1 },
        { name: 'Gaming', slug: 'gaming', parentSlug: null, order: 2 },
      ];

      const existing = ['anime'];
      const missing = filterMissingCategories(plan, existing);

      expect(missing.length).toBe(2);
      expect(missing.some(c => c.slug === 'anime')).toBe(false);
      expect(missing.some(c => c.slug === 'manga')).toBe(true);
    });

    test('returns empty if all exist', () => {
      const plan = [
        { name: 'Anime', slug: 'anime', parentSlug: null, order: 0 },
      ];

      const existing = ['anime'];
      const missing = filterMissingCategories(plan, existing);

      expect(missing.length).toBe(0);
    });
  });
});
