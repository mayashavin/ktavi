import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { reviewDraftWorkflow } from '../../src/workflows/reviewDraftWorkflow.js';
import type { TextAIProvider } from '../../src/core/providers.js';
import type { WritingSuggestion } from '../../src/core/types.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');

const SUGGESTIONS: WritingSuggestion[] = [
  {
    original: 'TanStack Query simplifies data management in Vue apps significantly.',
    suggested: 'TanStack Query significantly simplifies data management in Vue apps.',
    reason: 'Improves sentence flow by placing the adverb closer to the verb it modifies.',
    category: 'clarity',
    confidence: 0.94,
  },
  {
    original: 'Give it a try in your next project.',
    suggested: 'Try it in your next project.',
    reason: 'Removes filler wording for a more direct conclusion.',
    category: 'diction',
    confidence: 0.88,
  },
];

describe('reviewDraftWorkflow', () => {
  it('parses the draft and returns writing suggestions from the AI provider', async () => {
    const generateStructuredOutput = vi.fn().mockResolvedValue({ suggestions: SUGGESTIONS });
    const aiProvider: TextAIProvider = { generateStructuredOutput };

    const result = await reviewDraftWorkflow(VALID_POST, 'medium', aiProvider);

    expect(result.suggestions).toEqual(SUGGESTIONS);
    expect(generateStructuredOutput).toHaveBeenCalledOnce();
    expect(generateStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'writing_suggestions',
        systemPrompt: expect.stringContaining(
          'Focus on grammar, spelling, clarity, and sentence flow.',
        ),
        userPrompt: expect.stringContaining(
          'TanStack Query brings powerful data fetching, caching, and synchronization to Vue applications.',
        ),
      }),
    );
  });
});
