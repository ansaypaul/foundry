import { validateCategoryEnrichment } from './enrichCategoriesComplete';

// Note: Full integration tests would require mocking Supabase and OpenAI
// These are unit tests for validation logic

describe('enrichCategoriesComplete', () => {
  describe('validation', () => {
    it('passes valid category enrichment', () => {
      const valid = {
        seo_title: 'Tech | Site Name',
        seo_description: 'A well-crafted SEO description under 160 chars about technology and innovation topics.',
        long_description_html: '<p>First paragraph with good content.</p><p>Second paragraph with more details.</p><p>Third paragraph wrapping up.</p>',
      };

      expect(() => {
        // @ts-ignore - testing private function
        validateCategoryEnrichment(valid);
      }).not.toThrow();
    });

    it('rejects SEO description > 165 chars', () => {
      const invalid = {
        seo_title: 'Tech | Site',
        seo_description: 'A'.repeat(170),
        long_description_html: '<p>Valid HTML content here with enough words to pass word count.</p>',
      };

      expect(() => {
        // @ts-ignore
        validateCategoryEnrichment(invalid);
      }).toThrow(/SEO description too long/);
    });

    it('rejects content with emojis', () => {
      const invalid = {
        seo_title: 'Tech | Site',
        seo_description: 'Great content with emoji 🚀',
        long_description_html: '<p>Content</p>',
      };

      expect(() => {
        // @ts-ignore
        validateCategoryEnrichment(invalid);
      }).toThrow(/emojis/);
    });

    it('rejects content with long dash', () => {
      const invalid = {
        seo_title: 'Tech | Site',
        seo_description: 'Content with long dash — here',
        long_description_html: '<p>Content</p>',
      };

      expect(() => {
        // @ts-ignore
        validateCategoryEnrichment(invalid);
      }).toThrow(/long dash/);
    });

    it('rejects long description without <p> tags', () => {
      const invalid = {
        seo_title: 'Tech | Site',
        seo_description: 'Valid SEO description.',
        long_description_html: 'Plain text without HTML tags.',
      };

      expect(() => {
        // @ts-ignore
        validateCategoryEnrichment(invalid);
      }).toThrow(/must contain <p> tags/);
    });

    it('rejects long description with word count out of range', () => {
      const tooShort = {
        seo_title: 'Tech | Site',
        seo_description: 'Valid.',
        long_description_html: '<p>Too short.</p>',
      };

      expect(() => {
        // @ts-ignore
        validateCategoryEnrichment(tooShort);
      }).toThrow(/word count out of range/);
    });
  });
});
