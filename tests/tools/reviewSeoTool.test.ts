import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { parseMarkdownTool } from '../../src/tools/parse-markdown/index.js';
import { reviewSeoTool } from '../../src/tools/review-seo/index.js';
import { createMockTextAIProvider } from '../shared/createMockTextAIProvider.js';

const MISSING_META_POST = path.resolve('tests/fixtures/missing-meta.md');

describe('reviewSeoTool', () => {
  it('merges deterministic and AI suggestions', async () => {
    const draft = await parseMarkdownTool({ filePath: MISSING_META_POST });
    const aiSuggestion = {
      field: 'title' as const,
      severity: 'warning' as const,
      current: 'TanStack Query in Vue',
      suggested: 'Using TanStack Query in Vue Apps',
      reason: 'Make the title more descriptive for search results.',
      source: 'ai' as const,
    };

    const result = await reviewSeoTool(
      { draft },
      createMockTextAIProvider({ suggestions: [aiSuggestion] }),
    );

    expect(result.suggestions).toHaveLength(4);
    expect(result.suggestions.slice(0, 3)).toMatchObject([
      { field: 'description', source: 'deterministic' },
      { field: 'tags', source: 'deterministic' },
      { field: 'cover', source: 'deterministic' },
    ]);
    expect(result.suggestions[3]).toEqual(aiSuggestion);
  });
});
