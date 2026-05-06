import { describe, it, expect } from 'vitest';
import { summarizeContentTool } from '../../src/tools/summarize-content/index.js';
import type { TextAIProvider } from '../../src/core/providers.js';
import type { BlogDraft } from '../../src/core/types.js';

function makeDraft(overrides?: Partial<BlogDraft>): BlogDraft {
  return {
    filePath: 'test.md',
    rawContent: '---\ntitle: Test\n---\nHello world',
    frontmatter: { title: 'Test Post' },
    markdownBody: 'Hello world. This is a test blog post about TypeScript generics.',
    metadata: {
      title: 'Test Post',
      tags: [],
      headings: [],
      links: [],
      images: [],
      wordCount: 12,
      estimatedReadingTimeMinutes: 1,
    },
    ...overrides,
  };
}

function makeProvider(response: unknown): TextAIProvider {
  return {
    generateStructuredOutput: async () => response,
  } as TextAIProvider;
}

describe('summarizeContentTool', () => {
  it('returns a valid content summary from AI response', async () => {
    const aiResponse = {
      shortSummary: 'A guide to TypeScript generics.',
      keyTopics: ['TypeScript', 'generics', 'type safety'],
      targetAudience: 'Intermediate TypeScript developers',
      suggestedDescription: 'Learn how TypeScript generics improve type safety in your codebase.',
    };

    const result = await summarizeContentTool({ draft: makeDraft() }, makeProvider(aiResponse));

    expect(result.shortSummary).toBe('A guide to TypeScript generics.');
    expect(result.keyTopics).toEqual(['TypeScript', 'generics', 'type safety']);
    expect(result.targetAudience).toBe('Intermediate TypeScript developers');
    expect(result.suggestedDescription).toBe(
      'Learn how TypeScript generics improve type safety in your codebase.',
    );
  });

  it('throws on invalid AI response (missing required fields)', async () => {
    const badResponse = {
      shortSummary: 'A summary.',
    };

    await expect(
      summarizeContentTool({ draft: makeDraft() }, makeProvider(badResponse)),
    ).rejects.toThrow();
  });

  it('throws on wrong field types', async () => {
    const badResponse = {
      shortSummary: 'A summary.',
      keyTopics: 'not an array',
      targetAudience: 'developers',
      suggestedDescription: 'desc',
    };

    await expect(
      summarizeContentTool({ draft: makeDraft() }, makeProvider(badResponse)),
    ).rejects.toThrow();
  });

  it('passes title in the user prompt when available', async () => {
    let capturedPrompt = '';
    const provider: TextAIProvider = {
      async generateStructuredOutput(input) {
        capturedPrompt = input.userPrompt;
        return {
          shortSummary: 'summary',
          keyTopics: ['topic1', 'topic2', 'topic3'],
          targetAudience: 'audience',
          suggestedDescription: 'description',
        };
      },
    };

    await summarizeContentTool({ draft: makeDraft() }, provider);
    expect(capturedPrompt).toContain('Title: Test Post');
  });

  it('omits title line when frontmatter has no title', async () => {
    let capturedPrompt = '';
    const provider: TextAIProvider = {
      async generateStructuredOutput(input) {
        capturedPrompt = input.userPrompt;
        return {
          shortSummary: 'summary',
          keyTopics: ['topic1', 'topic2', 'topic3'],
          targetAudience: 'audience',
          suggestedDescription: 'description',
        };
      },
    };

    const draft = makeDraft({ frontmatter: {} });
    await summarizeContentTool({ draft }, provider);
    expect(capturedPrompt).not.toContain('Title:');
  });
});
