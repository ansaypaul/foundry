import { buildAuthorsPlan, filterMissingAuthors, generateAuthorSlug } from './authorsGenerator';
import { SiteDecisionProfile } from '@/lib/core/decisionEngine/types';

describe('Authors Generator', () => {
  describe('buildAuthorsPlan', () => {
    test('small site (1-2 authors, low velocity) => 2 authors', () => {
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

      const plan = buildAuthorsPlan({
        siteName: 'TestSite',
        profile,
      });

      expect(plan.length).toBe(2);
      expect(plan[0].roleKey).toBe('editorial_lead');
      expect(plan[0].displayName).toBe('Rédaction TestSite');
      expect(plan[1].roleKey).toBe('specialist_anime_manga');
      
      // Low velocity => no news_writer
      expect(plan.some(a => a.roleKey === 'news_writer')).toBe(false);
    });

    test('medium site (3-5 authors, medium velocity) => 4 authors with news_writer', () => {
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

      const plan = buildAuthorsPlan({
        siteName: 'MediumSite',
        profile,
      });

      // (3+5)/2 = 4 authors
      expect(plan.length).toBe(4);
      expect(plan[0].roleKey).toBe('editorial_lead');
      expect(plan[1].roleKey).toBe('specialist_anime_manga');
      expect(plan[2].roleKey).toBe('specialist_gaming');
      
      // Last one should be news_writer (velocity=medium, count>=4)
      expect(plan[3].roleKey).toBe('news_writer');
      expect(plan[3].specialties).toContain('actualité');
    });

    test('large site (6-10 authors, high velocity) => 8 authors', () => {
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

      const plan = buildAuthorsPlan({
        siteName: 'LargeSite',
        profile,
      });

      // (6+10)/2 = 8 authors
      expect(plan.length).toBe(8);
      expect(plan[0].roleKey).toBe('editorial_lead');
      expect(plan[1].roleKey).toBe('specialist_anime_manga');
      expect(plan[2].roleKey).toBe('specialist_gaming');
      expect(plan[3].roleKey).toBe('specialist_culture');
      
      // Should have general specialists
      expect(plan.some(a => a.roleKey.startsWith('specialist_general_'))).toBe(true);
      
      // Last one should be news_writer (velocity=high)
      expect(plan[plan.length - 1].roleKey).toBe('news_writer');
    });

    test('all authors have required fields', () => {
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

      const plan = buildAuthorsPlan({
        siteName: 'TestSite',
        profile,
      });

      plan.forEach(author => {
        expect(author.roleKey).toBeTruthy();
        expect(author.displayName).toBeTruthy();
        expect(Array.isArray(author.specialties)).toBe(true);
        expect(author.specialties.length).toBeGreaterThan(0);
        expect(author.isAi).toBe(true);
      });
    });
  });

  describe('filterMissingAuthors', () => {
    test('removes existing authors from plan', () => {
      const plan = [
        { roleKey: 'editorial_lead', displayName: 'Lead', specialties: ['edit'], isAi: true },
        { roleKey: 'specialist_gaming', displayName: 'Gaming', specialties: ['games'], isAi: true },
        { roleKey: 'specialist_culture', displayName: 'Culture', specialties: ['culture'], isAi: true },
      ];

      const existing = ['editorial_lead'];
      const missing = filterMissingAuthors(plan, existing);

      expect(missing.length).toBe(2);
      expect(missing.some(a => a.roleKey === 'editorial_lead')).toBe(false);
      expect(missing.some(a => a.roleKey === 'specialist_gaming')).toBe(true);
    });

    test('returns empty if all exist', () => {
      const plan = [
        { roleKey: 'editorial_lead', displayName: 'Lead', specialties: ['edit'], isAi: true },
      ];

      const existing = ['editorial_lead'];
      const missing = filterMissingAuthors(plan, existing);

      expect(missing.length).toBe(0);
    });
  });

  describe('generateAuthorSlug', () => {
    test('generates slug from display name', () => {
      expect(generateAuthorSlug('Rédaction JapanPop')).toBe('redaction-japanpop');
      expect(generateAuthorSlug('Expert Anime & Manga')).toBe('expert-anime-manga');
      expect(generateAuthorSlug('Spécialiste 1')).toBe('specialiste-1');
    });

    test('handles accents and special chars', () => {
      expect(generateAuthorSlug('Éditeur en Chef')).toBe('editeur-en-chef');
      expect(generateAuthorSlug('Test@123')).toBe('test-123');
    });
  });
});
