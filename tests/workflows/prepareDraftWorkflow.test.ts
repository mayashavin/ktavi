import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { prepareDraftWorkflow } from '../../src/workflows/prepareDraftWorkflow.js';
import type {
  TextAIProvider,
  ImageGenerationProvider,
  AssetStorageProvider,
} from '../../src/core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../src/core/types.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');
const MISSING_META_POST = path.resolve('tests/fixtures/missing-meta.md');

/**
 * A multi-response mock AI provider that returns the correct structure
 * for each tool based on the schemaName parameter.
 */
function makeAiProvider(): TextAIProvider {
  return {
    async generateStructuredOutput({ schemaName }) {
      if (schemaName === 'seo_suggestions') {
        return {
          suggestions: [
            {
              field: 'description',
              severity: 'info',
              current:
                'Learn how to simplify data fetching and caching in Vue apps with TanStack Query.',
              suggested: 'A comprehensive guide to TanStack Query in Vue.',
              reason: 'Shorter, more direct description.',
              source: 'ai',
            },
          ],
        };
      }
      if (schemaName === 'content_summary') {
        return {
          shortSummary: 'A guide to using TanStack Query in Vue.',
          keyTopics: ['vue', 'tanstack-query', 'data-fetching'],
          targetAudience: 'Vue developers',
          suggestedDescription: 'Learn to use TanStack Query in Vue applications.',
        };
      }
      if (schemaName === 'writing_suggestions') {
        return {
          suggestions: [
            {
              original: 'TanStack Query brings powerful data fetching',
              suggested: 'TanStack Query provides powerful data fetching',
              reason: 'More precise word choice.',
              category: 'diction',
              confidence: 0.8,
            },
          ],
        };
      }
      if (schemaName === 'cover_prompt') {
        return {
          visualConcept: 'A Vue.js logo surrounded by data flow arrows',
          prompt: 'A stylized Vue.js logo with animated data flow arrows on a dark background.',
          altText: 'Vue.js data fetching concept illustration',
          suggestedFilename: 'tanstack-query-vue-cover',
        };
      }
      return {};
    },
  };
}

function makeImageProvider(): ImageGenerationProvider {
  return {
    async generateImage(): Promise<GeneratedImage> {
      return {
        fileName: 'tanstack-query-vue-cover',
        mimeType: 'image/png',
        base64: 'abc123',
      };
    },
  };
}

function makeStorageProvider(): AssetStorageProvider {
  return {
    async upload(): Promise<UploadedAsset> {
      return {
        provider: 'cloudinary',
        url: 'http://res.cloudinary.com/demo/image/upload/tanstack-query-vue-cover.png',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/tanstack-query-vue-cover.png',
        publicId: 'tanstack-query-vue-cover',
      };
    },
  };
}

describe('prepareDraftWorkflow', () => {
  it('returns draft and deterministic SEO suggestions when no AI provider given', async () => {
    const result = await prepareDraftWorkflow(MISSING_META_POST, {
      mode: 'medium',
      apply: false,
      generateCover: false,
      size: '1792x1024',
      coverField: 'cover',
    });

    expect(result.draft).toBeDefined();
    expect(result.seoSuggestions.length).toBeGreaterThan(0);
    expect(result.seoSuggestions.every((s) => s.source === 'deterministic')).toBe(true);
    expect(result.contentSummary).toBeUndefined();
    expect(result.writingSuggestions).toHaveLength(0);
    expect(result.coverPrompt).toBeUndefined();
    expect(result.patch).toBeUndefined();
  });

  it('returns contentSummary, writingSuggestions, and coverPrompt when AI provider is given', async () => {
    const result = await prepareDraftWorkflow(VALID_POST, {
      mode: 'medium',
      apply: false,
      generateCover: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
    });

    expect(result.draft).toBeDefined();

    // SEO: deterministic + ai suggestions
    expect(result.seoSuggestions.length).toBeGreaterThan(0);
    expect(result.seoSuggestions.some((s) => s.source === 'ai')).toBe(true);

    // Content summary
    expect(result.contentSummary).toBeDefined();
    expect(result.contentSummary!.shortSummary).toBe('A guide to using TanStack Query in Vue.');
    expect(result.contentSummary!.keyTopics).toEqual(['vue', 'tanstack-query', 'data-fetching']);
    expect(result.contentSummary!.targetAudience).toBe('Vue developers');

    // Writing suggestions
    expect(result.writingSuggestions).toHaveLength(1);
    expect(result.writingSuggestions[0].category).toBe('diction');

    // Cover prompt
    expect(result.coverPrompt).toBeDefined();
    expect(result.coverPrompt!.suggestedFilename).toBe('tanstack-query-vue-cover');

    // No image generation requested
    expect(result.patch).toBeUndefined();
  });

  it('returns patch when generateCover=true with imageProvider and storageProvider', async () => {
    const result = await prepareDraftWorkflow(VALID_POST, {
      mode: 'medium',
      apply: false,
      generateCover: true,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
      storageProvider: makeStorageProvider(),
    });

    expect(result.draft).toBeDefined();
    expect(result.coverPrompt).toBeDefined();
    expect(result.patch).toBeDefined();
    expect(result.patch!.diff).toBeTruthy();
    expect(result.patch!.changes.length).toBeGreaterThan(0);
    expect(result.patch!.changes[0].field).toBe('cover');
    // apply=false: updated content should contain the new cover URL but the file is not written
    expect(result.patch!.updatedContent).toContain(
      'https://res.cloudinary.com/demo/image/upload/tanstack-query-vue-cover.png',
    );
  });

  it('returns no patch when generateCover=true but no storageProvider given', async () => {
    const result = await prepareDraftWorkflow(VALID_POST, {
      mode: 'medium',
      apply: false,
      generateCover: true,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
    });

    expect(result.coverPrompt).toBeDefined();
    expect(result.patch).toBeUndefined();
  });

  it('returns no patch when generateCover=false even with imageProvider and storageProvider', async () => {
    const result = await prepareDraftWorkflow(VALID_POST, {
      mode: 'medium',
      apply: false,
      generateCover: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
      storageProvider: makeStorageProvider(),
    });

    expect(result.coverPrompt).toBeDefined();
    expect(result.patch).toBeUndefined();
  });
});
