import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { optimizeSeoWorkflow } from '../../src/workflows/optimizeSeoWorkflow.js';
import type { TextAIProvider } from '../../src/core/providers.js';
import type { SeoSuggestion } from '../../src/core/types.js';

const MISSING_META_POST = path.resolve('tests/fixtures/missing-meta.md');

const AI_SUGGESTIONS: SeoSuggestion[] = [
  {
    field: 'description',
    severity: 'critical',
    suggested: 'Learn how TanStack Query simplifies data fetching and caching in Vue apps.',
    reason: 'A specific meta description improves relevance for search queries.',
    source: 'ai',
  },
  {
    field: 'tags',
    severity: 'info',
    suggested: ['vue', 'tanstack-query', 'data-fetching'],
    reason: 'Relevant tags improve categorization and discoverability.',
    source: 'ai',
  },
];

function makeProvider(
  calls: Array<{ systemPrompt: string; userPrompt: string; schemaName: string }>,
): TextAIProvider {
  return {
    async generateStructuredOutput(input) {
      calls.push(input);
      return { suggestions: AI_SUGGESTIONS };
    },
  };
}

describe('optimizeSeoWorkflow', () => {
  it('merges deterministic SEO checks with mocked AI suggestions', async () => {
    const calls: Array<{ systemPrompt: string; userPrompt: string; schemaName: string }> = [];

    const result = await optimizeSeoWorkflow(MISSING_META_POST, {
      aiProvider: makeProvider(calls),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].schemaName).toBe('seo_suggestions');
    expect(calls[0].userPrompt).toContain('Title: TanStack Query in Vue');
    expect(calls[0].userPrompt).toContain('TanStack Query can make data fetching');
    expect(calls[0].userPrompt).toContain('## Why it matters');

    expect(result.patch).toBeUndefined();
    expect(result.suggestions).toEqual([
      expect.objectContaining({
        field: 'description',
        severity: 'critical',
        source: 'deterministic',
      }),
      expect.objectContaining({
        field: 'tags',
        severity: 'warning',
        source: 'deterministic',
      }),
      expect.objectContaining({
        field: 'cover',
        severity: 'warning',
        source: 'deterministic',
      }),
      ...AI_SUGGESTIONS,
    ]);
  });
});
