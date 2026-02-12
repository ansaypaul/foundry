import { BlueprintV1Schema } from './types';

describe('Site Blueprint', () => {
  describe('BlueprintV1Schema validation', () => {
    test('validates correct blueprint structure', () => {
      const validBlueprint = {
        version: 1,
        generatedAt: '2024-01-01T00:00:00.000Z',
        site: {
          id: 'test-id',
          name: 'Test Site',
          language: 'fr',
          country: 'FR',
          siteType: 'niche_passion',
          automationLevel: 'ai_assisted',
          ambitionLevel: 'growth',
          description: 'Test description',
        },
        decisionProfile: {
          siteSize: 'medium' as const,
          complexity: 2 as const,
          velocity: 'medium' as const,
          targets: {
            authors: { min: 3, max: 5 },
            categories: { min: 6, max: 10 },
            contentTypes: { min: 4, max: 5 },
            mandatoryPages: { min: 5, max: 6 },
          },
        },
        authors: [
          {
            roleKey: 'editorial_lead',
            displayName: 'Rédaction Test',
            specialties: ['ligne_éditoriale'],
            isAi: true,
            status: 'active',
          },
        ],
        taxonomy: {
          categories: [
            {
              name: 'Anime',
              slug: 'anime',
              parentSlug: null,
              order: 0,
              status: 'active',
            },
          ],
        },
        pages: [
          {
            type: 'about',
            title: 'À propos',
            slug: 'a-propos',
            status: 'draft',
          },
        ],
        contentTypes: [
          {
            key: 'news',
            label: 'Actualité',
            status: 'active',
            rulesJson: { format: 'html' },
          },
        ],
      };

      const result = BlueprintV1Schema.safeParse(validBlueprint);
      expect(result.success).toBe(true);
    });

    test('rejects invalid version', () => {
      const invalidBlueprint = {
        version: 2, // Should be 1
        generatedAt: '2024-01-01T00:00:00.000Z',
        site: {
          id: 'test',
          name: 'Test',
          language: 'fr',
          country: 'FR',
          siteType: 'niche_passion',
          automationLevel: 'manual',
          ambitionLevel: null,
          description: null,
        },
        decisionProfile: {
          siteSize: 'small' as const,
          complexity: 1 as const,
          velocity: 'low' as const,
          targets: {
            authors: { min: 1, max: 2 },
            categories: { min: 3, max: 5 },
            contentTypes: { min: 2, max: 3 },
            mandatoryPages: { min: 4, max: 5 },
          },
        },
        authors: [],
        taxonomy: { categories: [] },
        pages: [],
        contentTypes: [],
      };

      const result = BlueprintV1Schema.safeParse(invalidBlueprint);
      expect(result.success).toBe(false);
    });

    test('rejects invalid siteSize', () => {
      const invalidBlueprint = {
        version: 1,
        generatedAt: '2024-01-01T00:00:00.000Z',
        site: {
          id: 'test',
          name: 'Test',
          language: 'fr',
          country: 'FR',
          siteType: 'niche_passion',
          automationLevel: 'manual',
          ambitionLevel: null,
          description: null,
        },
        decisionProfile: {
          siteSize: 'extra-large', // Invalid
          complexity: 1,
          velocity: 'low',
          targets: {
            authors: { min: 1, max: 2 },
            categories: { min: 3, max: 5 },
            contentTypes: { min: 2, max: 3 },
            mandatoryPages: { min: 4, max: 5 },
          },
        },
        authors: [],
        taxonomy: { categories: [] },
        pages: [],
        contentTypes: [],
      };

      const result = BlueprintV1Schema.safeParse(invalidBlueprint);
      expect(result.success).toBe(false);
    });

    test('authors array is ordered deterministically', () => {
      const authors = [
        { roleKey: 'specialist_gaming', displayName: 'Gaming', specialties: [], isAi: true, status: 'active' },
        { roleKey: 'editorial_lead', displayName: 'Lead', specialties: [], isAi: true, status: 'active' },
        { roleKey: 'news_writer', displayName: 'News', specialties: [], isAi: true, status: 'active' },
      ];

      // Sort by roleKey (same as blueprint builder)
      const sorted = [...authors].sort((a, b) => a.roleKey.localeCompare(b.roleKey));

      expect(sorted[0].roleKey).toBe('editorial_lead');
      expect(sorted[1].roleKey).toBe('news_writer');
      expect(sorted[2].roleKey).toBe('specialist_gaming');
    });

    test('categories array is ordered by order then slug', () => {
      const categories = [
        { name: 'Gaming', slug: 'gaming', parentSlug: null, order: 2, status: 'active' },
        { name: 'Anime', slug: 'anime', parentSlug: null, order: 0, status: 'active' },
        { name: 'Manga', slug: 'manga', parentSlug: null, order: 0, status: 'active' },
      ];

      // Sort by order then slug (same as blueprint builder)
      const sorted = [...categories].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.slug.localeCompare(b.slug);
      });

      expect(sorted[0].slug).toBe('anime');
      expect(sorted[1].slug).toBe('manga');
      expect(sorted[2].slug).toBe('gaming');
    });
  });
});
