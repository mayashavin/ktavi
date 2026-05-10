import { describe, it, expect } from 'vitest';
import { reviewWritingTool } from '../../src/tools/review-writing/index.js';
import { createMockTextAIProvider } from '../shared/createMockTextAIProvider.js';
import type { BlogDraft } from '../../src/core/types.js';

function makeDraft(overrides?: Partial<BlogDraft>): BlogDraft {
  return {
    filePath: 'test.md',
    rawContent: '---\ntitle: Test\n---\nHello world',
    frontmatter: { title: 'Test Post' },
    markdownBody: 'This are bad grammar.',
    metadata: {
      title: 'Test Post',
      tags: [],
      headings: [],
      links: [],
      images: [],
      wordCount: 4,
      estimatedReadingTimeMinutes: 1,
    },
    ...overrides,
  };
}

describe('reviewWritingTool', () => {
  it('returns suggestions for valid AI response schema', async () => {
    const aiResponse = {
      suggestions: [
        {
          original: 'This are bad grammar.',
          suggested: 'This is bad grammar.',
          reason: 'Fix subject-verb agreement.',
          category: 'grammar',
          confidence: 0.9,
        },
      ],
    };

    const result = await reviewWritingTool(
      { draft: makeDraft(), mode: 'medium' },
      createMockTextAIProvider(aiResponse),
    );

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].confidence).toBe(0.9);
  });

  it('throws on invalid AI response schema', async () => {
    const aiResponse = {
      suggestions: [
        {
          original: 'This are bad grammar.',
          suggested: 'This is bad grammar.',
          reason: 'Fix subject-verb agreement.',
          category: 'grammar',
          confidence: 2,
        },
      ],
    };

    await expect(
      reviewWritingTool(
        { draft: makeDraft(), mode: 'medium' },
        createMockTextAIProvider(aiResponse),
      ),
    ).rejects.toThrow();
  });
});
