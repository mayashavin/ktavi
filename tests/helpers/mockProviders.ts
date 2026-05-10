import type {
  TextAIProvider,
  ImageGenerationProvider,
  AssetStorageProvider,
} from '../../src/core/providers.js';
import type {
  ContentSummary,
  CoverPromptResult,
  GeneratedImage,
  UploadedAsset,
} from '../../src/core/types.js';

const DEFAULT_WRITING_SUGGESTIONS = {
  suggestions: [
    {
      original: 'This are a test.',
      suggested: 'This is a test.',
      reason: 'Fix subject-verb agreement.',
      category: 'grammar' as const,
      confidence: 0.95,
    },
  ],
};

const DEFAULT_SEO_SUGGESTIONS = {
  suggestions: [
    {
      field: 'description' as const,
      severity: 'warning' as const,
      current: 'A short description.',
      suggested: 'An in-depth guide to the topic covered in this post.',
      reason: 'A more descriptive meta description improves SEO discoverability.',
      source: 'ai' as const,
    },
  ],
};

const DEFAULT_COVER_PROMPT: CoverPromptResult = {
  visualConcept: 'A minimalist code editor with glowing syntax highlighting on a dark background',
  prompt:
    'A minimalist code editor with glowing syntax highlighting on a dark background, digital art style.',
  altText: 'Code editor with colorful syntax highlighting',
  suggestedFilename: 'code-editor-highlight',
};

const DEFAULT_CONTENT_SUMMARY: ContentSummary = {
  shortSummary: 'A comprehensive guide to the topic of this post.',
  keyTopics: ['testing', 'TypeScript', 'best practices'],
  targetAudience: 'TypeScript developers',
  suggestedDescription: 'Learn about the core concepts and best practices covered in this post.',
};

const DEFAULT_RESPONSES: Record<string, unknown> = {
  writing_suggestions: DEFAULT_WRITING_SUGGESTIONS,
  seo_suggestions: DEFAULT_SEO_SUGGESTIONS,
  cover_prompt: DEFAULT_COVER_PROMPT,
  content_summary: DEFAULT_CONTENT_SUMMARY,
};

/**
 * Creates a TextAIProvider that returns pre-defined canned responses keyed by schema name.
 * Defaults are provided for all known schemas; pass `overrides` to customise specific responses.
 */
export function createMockTextAIProvider(overrides?: Record<string, unknown>): TextAIProvider {
  const responses = { ...DEFAULT_RESPONSES, ...overrides };
  return {
    generateStructuredOutput: async <TOutput>(input: { schemaName: string }) =>
      responses[input.schemaName] as TOutput,
  };
}

/**
 * Creates an ImageGenerationProvider that returns a deterministic test image buffer.
 * Pass `overrides` to customise specific fields of the returned GeneratedImage.
 */
export function createMockImageGenerationProvider(
  overrides?: Partial<GeneratedImage>,
): ImageGenerationProvider {
  return {
    generateImage: async (input) => ({
      fileName: input.fileName,
      mimeType: 'image/png',
      buffer: Buffer.from('mock-image-data'),
      ...overrides,
    }),
  };
}

/**
 * Creates an AssetStorageProvider that returns a fake uploaded asset URL.
 * Pass `overrides` to customise specific fields of the returned UploadedAsset.
 */
export function createMockAssetStorageProvider(
  overrides?: Partial<UploadedAsset>,
): AssetStorageProvider {
  return {
    upload: async (image) => ({
      provider: 'local' as const,
      url: `/images/blog/${image.fileName}.png`,
      localPath: `/tmp/mock-uploads/${image.fileName}.png`,
      ...overrides,
    }),
  };
}
