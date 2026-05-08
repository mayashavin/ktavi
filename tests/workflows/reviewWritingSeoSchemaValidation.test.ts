import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { reviewDraftWorkflow } from '../../src/workflows/reviewDraftWorkflow.js';
import { optimizeSeoWorkflow } from '../../src/workflows/optimizeSeoWorkflow.js';
import type { TextAIProvider } from '../../src/core/providers.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');

function makeProvider(response: unknown): TextAIProvider {
  return {
    generateStructuredOutput: async () => response,
  };
}

describe('review and seo workflows schema validation', () => {
  it('accepts a valid writing review provider response', async () => {
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

    const result = await reviewDraftWorkflow(VALID_POST, 'medium', makeProvider(aiResponse));
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].confidence).toBe(0.9);
  });

  it('throws when writing review provider returns invalid schema', async () => {
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
      reviewDraftWorkflow(VALID_POST, 'medium', makeProvider(aiResponse)),
    ).rejects.toThrow();
  });

  it('accepts a valid seo provider response', async () => {
    const aiResponse = {
      suggestions: [
        {
          field: 'title',
          severity: 'warning',
          current: 'old title',
          suggested: 'Better title',
          reason: 'Improve relevance.',
          source: 'ai',
        },
      ],
    };

    const result = await optimizeSeoWorkflow(VALID_POST, { aiProvider: makeProvider(aiResponse) });
    expect(result.suggestions.some((suggestion) => suggestion.source === 'ai')).toBe(true);
  });

  it('throws when seo provider returns invalid schema', async () => {
    const aiResponse = {
      suggestions: [
        {
          field: 'title',
          severity: 'invalid-severity',
          reason: 'Missing an informative title.',
          source: 'ai',
        },
      ],
    };

    await expect(
      optimizeSeoWorkflow(VALID_POST, { aiProvider: makeProvider(aiResponse) }),
    ).rejects.toThrow();
  });
});
