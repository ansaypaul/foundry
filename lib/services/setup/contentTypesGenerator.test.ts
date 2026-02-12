import { buildContentTypesPlan, filterMissingContentTypes } from './contentTypesGenerator';
import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

describe('Content Types Generator', () => {
  describe('buildContentTypesPlan', () => {
    test('niche_passion + medium => 4 types in correct order', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      // (4+5)/2 = 4.5 rounded = 5, but capped at 4 for medium
      expect(plan.length).toBe(4);

      // Check order
      expect(plan[0].key).toBe('news');
      expect(plan[0].label).toBe('Actualité');
      
      expect(plan[1].key).toBe('review_test');
      expect(plan[1].label).toBe('Critique / Test');
      
      expect(plan[2].key).toBe('feature_dossier');
      expect(plan[2].label).toBe('Dossier');
      
      expect(plan[3].key).toBe('evergreen_guide');
      expect(plan[3].label).toBe('Guide');

      // Should NOT include interview (5th item)
      expect(plan.some(t => t.key === 'interview')).toBe(false);
    });

    test('news type has correct rules overrides', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      const newsType = plan.find(t => t.key === 'news');
      
      expect(newsType).toBeDefined();
      expect(newsType!.rulesJson.length.min_words).toBe(400);
      expect(newsType!.rulesJson.length.target_words).toBe(700);
      expect(newsType!.rulesJson.structure.h2_count_target).toBe(2);
      expect(newsType!.rulesJson.defaults.preferred_author_role_keys).toContain('news_writer');
    });

    test('review_test type has correct rules', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      const reviewType = plan.find(t => t.key === 'review_test');
      
      expect(reviewType).toBeDefined();
      expect(reviewType!.rulesJson.length.min_words).toBe(900);
      expect(reviewType!.rulesJson.length.target_words).toBe(1400);
      expect(reviewType!.rulesJson.structure.h2_count_target).toBe(4);
      expect(reviewType!.rulesJson.defaults.preferred_author_role_keys).toContain('specialist_gaming');
      expect(reviewType!.rulesJson.defaults.preferred_author_role_keys).toContain('specialist_anime_manga');
    });

    test('evergreen_guide type has correct rules', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      const guideType = plan.find(t => t.key === 'evergreen_guide');
      
      expect(guideType).toBeDefined();
      expect(guideType!.rulesJson.length.min_words).toBe(1200);
      expect(guideType!.rulesJson.length.target_words).toBe(1800);
      expect(guideType!.rulesJson.structure.h2_count_target).toBe(5);
      expect(guideType!.rulesJson.defaults.preferred_author_role_keys).toContain('editorial_lead');
    });

    test('small site => 3 types', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      // (2+3)/2 = 2.5 rounded = 3, matches small cap of 3
      expect(plan.length).toBe(3);
      expect(plan[0].key).toBe('news');
      expect(plan[1].key).toBe('review_test');
      expect(plan[2].key).toBe('feature_dossier');
    });

    test('large site => 5 types', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'niche_passion',
        profile,
      });

      // (6+8)/2 = 7, capped at 5 for large
      expect(plan.length).toBe(5);
      expect(plan[4].key).toBe('interview');
    });

    test('all types have required fields', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'gaming_popculture',
        profile,
      });

      plan.forEach(type => {
        expect(type.key).toBeTruthy();
        expect(type.label).toBeTruthy();
        expect(type.rulesJson).toBeDefined();
        expect(type.rulesJson.length).toBeDefined();
        expect(type.rulesJson.structure).toBeDefined();
        expect(type.rulesJson.constraints).toBeDefined();
      });
    });

    test('news_media site type has different templates', () => {
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

      const plan = buildContentTypesPlan({
        siteType: 'news_media',
        profile,
      });

      expect(plan.length).toBe(4);
      expect(plan[0].key).toBe('news');
      expect(plan[1].key).toBe('analysis');
      expect(plan[2].key).toBe('investigation');
      expect(plan[3].key).toBe('interview');
    });
  });

  describe('filterMissingContentTypes', () => {
    test('removes existing types from plan', () => {
      const plan = [
        { key: 'news', label: 'News', rulesJson: {} as any },
        { key: 'review', label: 'Review', rulesJson: {} as any },
        { key: 'guide', label: 'Guide', rulesJson: {} as any },
      ];

      const existing = ['news'];
      const missing = filterMissingContentTypes(plan, existing);

      expect(missing.length).toBe(2);
      expect(missing.some(t => t.key === 'news')).toBe(false);
      expect(missing.some(t => t.key === 'review')).toBe(true);
    });

    test('returns empty if all exist', () => {
      const plan = [
        { key: 'news', label: 'News', rulesJson: {} as any },
      ];

      const existing = ['news'];
      const missing = filterMissingContentTypes(plan, existing);

      expect(missing.length).toBe(0);
    });
  });
});
