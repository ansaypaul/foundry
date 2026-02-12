import { validateArticleContent } from './articleValidator';
import { ContentTypeRules } from '../setup/contentTypesGenerator';

describe('Article Validator', () => {
  const baseRules: ContentTypeRules = {
    format: 'html',
    allowed_tags: ['h2', 'p', 'b', 'i', 'ul', 'li'],
    constraints: {
      no_emojis: true,
      no_em_dash: true,
      no_generic_conclusion: true,
      max_lists: 1,
      min_list_items: 2,
      min_paragraphs_per_h2: 2,
    },
    length: {
      min_words: 400,
      target_words: 700,
    },
    structure: {
      required_sections: ['intro'],
      h2_count_target: 2,
    },
    defaults: {
      preferred_author_role_keys: [],
    },
  };

  test('valid article passes', () => {
    const validHtml = `
      <p>Introduction with enough words to meet the minimum requirement of four hundred words total. This is a comprehensive test article with proper structure, detailed content, and meaningful information spread across multiple sections to demonstrate complete compliance with all validation rules and requirements.</p>
      <h2>First Section</h2>
      <p>First paragraph of the first section with sufficient content and detailed explanations. This paragraph contains meaningful information that contributes to the overall article quality and ensures we meet all structural requirements while maintaining readability and coherence throughout the entire document.</p>
      <p>Second paragraph of the first section with more details and additional context. We continue to expand on the topic with relevant information, examples, and explanations that help readers understand the subject matter while simultaneously ensuring our article meets the minimum word count requirement of four hundred words.</p>
      <h2>Second Section</h2>
      <p>First paragraph of the second section continues the discussion with new perspectives and insights. This section builds upon the foundation established in the previous section, adding depth and breadth to our coverage of the topic while maintaining consistency in tone and style throughout the entire article.</p>
      <p>Second paragraph of the second section provides additional analysis and comprehensive coverage. We explore different aspects of the subject, examine various viewpoints, and present well-researched information that adds value for readers while ensuring complete compliance with all content type rules and validation requirements.</p>
      <p>Additional content to thoroughly explain complex concepts and provide readers with actionable insights. This paragraph expands on key themes, offers practical examples, and demonstrates expertise in the subject matter while contributing to our overall word count goal of exceeding four hundred words comfortably.</p>
      <p>More comprehensive analysis and detailed explanations to ensure complete coverage of all relevant topics. We continue building a robust article that not only meets technical validation requirements but also delivers genuine value to readers through thoughtful writing and careful attention to content quality standards.</p>
      <p>Final concluding thoughts that tie together all previous points and provide readers with clear takeaways. This paragraph summarizes our key messages, reinforces important concepts, and leaves readers with a strong understanding of the subject while ensuring we have substantially exceeded the minimum word count requirement.</p>
      <p>Closing remarks with final insights and recommendations for readers who want to learn more about this topic. We provide additional resources, suggest next steps, and encourage further exploration of related subjects to maximize the educational value and practical application of the information presented throughout this comprehensive article.</p>
    `;

    const result = validateArticleContent({
      html: validHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.stats.wordCount).toBeGreaterThanOrEqual(400);
  });

  test('too short article fails', () => {
    const shortHtml = `
      <p>This is too short.</p>
    `;

    const result = validateArticleContent({
      html: shortHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'WORD_COUNT_TOO_LOW')).toBe(true);
    expect(result.stats.wordCount).toBeLessThan(400);
  });

  test('emoji detected fails', () => {
    const emojiHtml = `
      <p>This article contains an emoji 😀 which is not allowed according to the rules set forth.</p>
      ${Array(100).fill('<p>Additional content to meet word count requirements for this test case scenario.</p>').join('')}
    `;

    const result = validateArticleContent({
      html: emojiHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'CONTAINS_EMOJIS')).toBe(true);
  });

  test('em dash detected fails', () => {
    const emDashHtml = `
      <p>This article uses an em dash — which is not allowed in this content type format.</p>
      ${Array(100).fill('<p>Additional content to meet word count requirements for this test case scenario.</p>').join('')}
    `;

    const result = validateArticleContent({
      html: emDashHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'CONTAINS_EM_DASH')).toBe(true);
  });

  test('list with 1 item fails', () => {
    const shortListHtml = `
      <p>Introduction with sufficient content for validation purposes and to meet minimum word requirements.</p>
      <h2>Section</h2>
      <p>First paragraph of section.</p>
      <p>Second paragraph of section.</p>
      <ul>
        <li>Only one item</li>
      </ul>
      ${Array(80).fill('<p>Additional content to meet word count requirements for this test case.</p>').join('')}
    `;

    const result = validateArticleContent({
      html: shortListHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'LIST_TOO_SHORT')).toBe(true);
  });

  test('H2 with only 1 paragraph fails', () => {
    const shortSectionHtml = `
      <p>Introduction with sufficient content for validation.</p>
      ${Array(80).fill('<p>Additional content to meet word count requirements.</p>').join('')}
      <h2>Section with insufficient paragraphs</h2>
      <p>Only one paragraph here, but rules require at least two.</p>
    `;

    const result = validateArticleContent({
      html: shortSectionHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'H2_SECTION_TOO_SHORT')).toBe(true);
  });

  test('too many lists fails', () => {
    const tooManyListsHtml = `
      <p>Introduction paragraph.</p>
      <ul>
        <li>First list item one</li>
        <li>First list item two</li>
      </ul>
      <ul>
        <li>Second list item one</li>
        <li>Second list item two</li>
      </ul>
      ${Array(80).fill('<p>Additional content to meet word count.</p>').join('')}
    `;

    const result = validateArticleContent({
      html: tooManyListsHtml,
      contentTypeRules: baseRules,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'TOO_MANY_LISTS')).toBe(true);
    expect(result.stats.listCount).toBe(2);
  });

  test('stats are calculated correctly', () => {
    const testHtml = `
      <h2>Section One</h2>
      <p>Paragraph one.</p>
      <p>Paragraph two.</p>
      <h2>Section Two</h2>
      <p>Paragraph three.</p>
      <p>Paragraph four.</p>
      <p>Paragraph five.</p>
      <ul>
        <li>Item one</li>
        <li>Item two</li>
      </ul>
      ${Array(70).fill('<p>Padding content.</p>').join('')}
    `;

    const result = validateArticleContent({
      html: testHtml,
      contentTypeRules: baseRules,
    });

    expect(result.stats.h2Count).toBe(2);
    expect(result.stats.listCount).toBe(1);
    expect(result.stats.paragraphsPerH2.length).toBe(2);
    expect(result.stats.paragraphsPerH2[0]).toBe(2); // First H2 has 2 paragraphs
    expect(result.stats.paragraphsPerH2[1]).toBeGreaterThan(2); // Second H2 has more (includes padding)
  });
});
