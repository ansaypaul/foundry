import {
  buildSeoBootstrapPlan,
  applySeoBootstrapPlan,
  getSeoBootstrapStats,
} from './seoBootstrap';
import { getSupabaseAdmin } from '@/lib/db/client';

// Mock Supabase
jest.mock('@/lib/db/client');

const mockSupabase = {
  from: jest.fn(),
};

(getSupabaseAdmin as jest.Mock).mockReturnValue(mockSupabase);

describe('seoBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildSeoBootstrapPlan', () => {
    it('creates site SEO defaults if missing', async () => {
      const siteId = 'site-123';
      
      // Mock site data
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'sites') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: siteId,
                    name: 'Test Site',
                    description: 'Test description',
                  },
                }),
              }),
            }),
          };
        }
        
        if (table === 'seo_meta') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null }), // No existing SEO
                }),
                in: () => ({
                  then: async () => ({ data: [] }),
                }),
              }),
            }),
          };
        }
        
        if (table === 'content' || table === 'terms') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  then: async () => ({ data: [] }),
                }),
                not: () => ({
                  order: () => ({
                    then: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        
        return { select: () => ({}) };
      });

      const plan = await buildSeoBootstrapPlan(siteId);

      expect(plan.siteSeo).toBeTruthy();
      expect(plan.siteSeo?.seoTitleTemplate).toBe('{{title}} | {{siteName}}');
      expect(plan.siteSeo?.robotsDefault.index).toBe(true);
    });

    it('creates SEO for pages without existing SEO', async () => {
      const siteId = 'site-123';
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'sites') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: siteId,
                    name: 'Test Site',
                    description: 'Test',
                  },
                }),
              }),
            }),
          };
        }
        
        if (table === 'content') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  then: async () => ({
                    data: [
                      { id: 'page-1', title: 'About', page_type: 'about' },
                      { id: 'page-2', title: 'Contact', page_type: 'contact' },
                    ],
                  }),
                }),
              }),
            }),
          };
        }
        
        if (table === 'seo_meta') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null }),
                }),
                in: () => ({
                  then: async () => ({ data: [] }), // No existing page SEO
                }),
              }),
            }),
          };
        }
        
        if (table === 'terms') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  then: async () => ({ data: [] }),
                }),
              }),
            }),
          };
        }
        
        return { select: () => ({}) };
      });

      const plan = await buildSeoBootstrapPlan(siteId);

      expect(plan.contentSeo.length).toBe(2);
      expect(plan.contentSeo[0].seoTitle).toContain('About');
      expect(plan.contentSeo[0].robotsIndex).toBe(true);
    });

    it('creates SEO for categories without existing SEO', async () => {
      const siteId = 'site-123';
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'sites') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: siteId,
                    name: 'Test Site',
                    description: 'Test',
                  },
                }),
              }),
            }),
          };
        }
        
        if (table === 'terms') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  then: async () => ({
                    data: [
                      { id: 'cat-1', name: 'Tech', slug: 'tech', type: 'category' },
                      { id: 'cat-2', name: 'Gaming', slug: 'gaming', type: 'category' },
                    ],
                  }),
                }),
              }),
            }),
          };
        }
        
        if (table === 'seo_meta') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null }),
                }),
                in: () => ({
                  then: async () => ({ data: [] }), // No existing category SEO
                }),
              }),
            }),
          };
        }
        
        if (table === 'content') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  then: async () => ({ data: [] }),
                }),
              }),
            }),
          };
        }
        
        return { select: () => ({}) };
      });

      const plan = await buildSeoBootstrapPlan(siteId);

      expect(plan.termSeo.length).toBe(2);
      expect(plan.termSeo[0].seoTitle).toContain('Tech');
      expect(plan.termSeo[0].seoDescription).toContain('articles sur Tech');
    });
  });

  describe('applySeoBootstrapPlan', () => {
    it('inserts site SEO if plan includes it', async () => {
      const siteId = 'site-123';
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });
      
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      const plan = {
        siteSeo: {
          seoTitleTemplate: '{{title}} | {{siteName}}',
          descriptionStrategy: 'excerpt_or_first_paragraph_155',
          defaultOgImage: null,
          defaultOgType: 'article',
          robotsDefault: { index: true, follow: true },
        },
        contentSeo: [],
        termSeo: [],
      };

      await applySeoBootstrapPlan(siteId, plan);

      expect(insertMock).toHaveBeenCalledWith({
        entity_type: 'site',
        entity_id: siteId,
        seo_title: plan.siteSeo.seoTitleTemplate,
        seo_description: plan.siteSeo.descriptionStrategy,
        seo_og_image: null,
        seo_og_type: 'article',
        seo_robots_index: true,
        seo_robots_follow: true,
      });
    });

    it('is idempotent - does not overwrite existing SEO', async () => {
      const siteId = 'site-123';
      
      // Plan with no siteSeo (already exists)
      const plan = {
        siteSeo: null,
        contentSeo: [],
        termSeo: [],
      };

      await applySeoBootstrapPlan(siteId, plan);

      // insert should not be called for site
      expect(mockSupabase.from).not.toHaveBeenCalledWith('seo_meta');
    });
  });
});
