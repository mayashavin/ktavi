import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { analyzeDraftWorkflow } from '../../src/workflows/analyzeDraftWorkflow.js';
import type { TextAIProvider } from '../../src/core/providers.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');

function makeProvider(): TextAIProvider {
  return {
    async generateStructuredOutput() {
      return {
        shortSummary: 'A post about testing.',
        keyTopics: ['testing', 'vitest'],
        targetAudience: 'developers',
        suggestedDescription: 'Learn about testing with vitest.',
      };
    },
  };
}

describe('analyzeDraftWorkflow', () => {
  it('returns draft without summary when no AI provider given', async () => {
    const result = await analyzeDraftWorkflow(VALID_POST);
    expect(result.draft).toBeDefined();
    expect(result.contentSummary).toBeUndefined();
  });

  it('returns draft without summary when options object has no provider', async () => {
    const result = await analyzeDraftWorkflow(VALID_POST, {});
    expect(result.draft).toBeDefined();
    expect(result.contentSummary).toBeUndefined();
  });

  it('returns content summary when AI provider is given', async () => {
    const result = await analyzeDraftWorkflow(VALID_POST, { aiProvider: makeProvider() });
    expect(result.draft).toBeDefined();
    expect(result.contentSummary).toBeDefined();
    expect(result.contentSummary!.shortSummary).toBe('A post about testing.');
    expect(result.contentSummary!.keyTopics).toEqual(['testing', 'vitest']);
    expect(result.contentSummary!.targetAudience).toBe('developers');
    expect(result.contentSummary!.suggestedDescription).toBe('Learn about testing with vitest.');
  });
});
