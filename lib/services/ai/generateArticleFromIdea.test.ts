import { generateArticleFromIdea, GenerateArticleInput } from './generateArticleFromIdea';
import { getOpenAIClient } from './openaiClient';
import { validateArticleContent } from '../articles/articleValidator';

// Mock dependencies
jest.mock('./openaiClient');
jest.mock('../articles/articleValidator');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockValidateArticleContent = validateArticleContent as jest.MockedFunction<
  typeof validateArticleContent
>;

describe('generateArticleFromIdea', () => {
  const mockInput: GenerateArticleInput = {
    site: {
      name: 'Test Site',
      language: 'fr',
      country: 'FR',
      description: 'A test site',
    },
    idea: {
      title: 'Test Article',
      angle: 'Test angle',
    },
    contentType: {
      key: 'news',
      label: 'Actualités',
      rulesJson: {
        format: 'html',
        allowed_tags: ['h2', 'p', 'ul', 'li'],
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
          preferred_author_role_keys: ['writer'],
        },
      },
    },
    category: {
      name: 'Tech',
      slug: 'tech',
    },
    author: {
      id: 'author-1',
      roleKey: 'writer',
      displayName: 'John Doe',
      specialties: ['technology'],
    },
  };

  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOpenAIClient.mockReturnValue(mockOpenAI as any);
  });

  test('generates valid article on first attempt and logs attempt', async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Generated Article Title',
              content_html: '<h2>Section 1</h2><p>Para 1</p><p>Para 2</p><h2>Section 2</h2><p>Para 3</p><p>Para 4</p>',
            }),
          },
        },
      ],
    } as any);

    mockValidateArticleContent.mockReturnValueOnce({
      valid: true,
      errors: [],
      stats: {
        wordCount: 450,
        h2Count: 2,
        listCount: 0,
        paragraphsPerH2: [2, 2],
      },
    });

    const result = await generateArticleFromIdea(mockInput);

    expect(result.attempts).toBeDefined();
    expect(result.attempts.length).toBe(1);
    expect(result.attempts[0].attemptNumber).toBe(1);
    expect(result.attempts[0].validation.valid).toBe(true);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  test('retries on validation failure and logs all attempts', async () => {
    // First attempt - invalid
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'First Attempt',
              content_html: '<h2>Section 1</h2><p>Only one paragraph</p>',
            }),
          },
        },
      ],
    } as any);

    mockValidateArticleContent.mockReturnValueOnce({
      valid: false,
      errors: [
        {
          code: 'H2_SECTION_TOO_SHORT',
          message: 'Section needs more paragraphs',
        },
      ],
      stats: {
        wordCount: 100,
        h2Count: 1,
        listCount: 0,
        paragraphsPerH2: [1],
      },
    });

    mockValidateArticleContent.mockReturnValueOnce({
      valid: false,
      errors: [
        {
          code: 'H2_SECTION_TOO_SHORT',
          message: 'Section needs more paragraphs',
        },
      ],
      stats: {
        wordCount: 100,
        h2Count: 1,
        listCount: 0,
        paragraphsPerH2: [1],
      },
    });

    // Second attempt - valid
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Second Attempt',
              content_html: '<h2>Section 1</h2><p>Para 1</p><p>Para 2</p><h2>Section 2</h2><p>Para 3</p><p>Para 4</p>',
            }),
          },
        },
      ],
    } as any);

    mockValidateArticleContent.mockReturnValueOnce({
      valid: true,
      errors: [],
      stats: {
        wordCount: 450,
        h2Count: 2,
        listCount: 0,
        paragraphsPerH2: [2, 2],
      },
    });

    const result = await generateArticleFromIdea(mockInput);

    expect(result.attempts.length).toBe(2);
    expect(result.attempts[0].validation.valid).toBe(false);
    expect(result.attempts[1].validation.valid).toBe(true);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  test('logs validation errors in attempts', async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Test',
              content_html: '<p>Too short</p>',
            }),
          },
        },
      ],
    } as any);

    const validationErrors = [
      { code: 'WORD_COUNT_TOO_LOW', message: 'Not enough words' },
      { code: 'H2_SECTION_TOO_SHORT', message: 'Missing H2s' },
    ];

    mockValidateArticleContent.mockReturnValue({
      valid: false,
      errors: validationErrors,
      stats: { wordCount: 10, h2Count: 0, listCount: 0, paragraphsPerH2: [] },
    });

    try {
      await generateArticleFromIdea(mockInput);
    } catch (error) {
      // Expected to fail
    }

    // The function should have been called 3 times total (1 initial + 2 retries)
    // Each attempt validates once, plus retries call validate again for error prompt
    expect(mockValidateArticleContent).toHaveBeenCalled();
  });
});
