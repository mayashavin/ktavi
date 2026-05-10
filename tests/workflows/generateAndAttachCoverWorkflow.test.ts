import { describe, it, expect, vi, afterEach } from 'vitest';
import path from 'node:path';

// Mock @inquirer/prompts before importing workflow
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}));

// Mock deleteFile to track cleanup calls without touching the filesystem
vi.mock('../../src/utils/fileSystem.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/fileSystem.js')>();
  return {
    ...actual,
    deleteFile: vi.fn(),
  };
});

import { select, input } from '@inquirer/prompts';
import { deleteFile } from '../../src/utils/fileSystem.js';
import { generateAndAttachCoverWorkflow } from '../../src/workflows/generateAndAttachCoverWorkflow.js';
import type {
  TextAIProvider,
  ImageGenerationProvider,
  AssetStorageProvider,
} from '../../src/core/providers.js';
import type { CoverPromptResult, GeneratedImage, UploadedAsset } from '../../src/core/types.js';
import { createMockAssetStorageProvider } from '../shared/createMockAssetStorageProvider.js';
import { createMockImageGenerationProvider } from '../shared/createMockImageGenerationProvider.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');
const MISSING_META_POST = path.resolve('tests/fixtures/missing-meta.md');

const COVER_PROMPT: CoverPromptResult = {
  visualConcept: 'A scenic mountain landscape',
  prompt: 'A scenic mountain landscape at sunrise.',
  altText: 'Mountain landscape at sunrise',
  suggestedFilename: 'mountain-landscape',
};

function makeAiProvider(): TextAIProvider {
  return {
    async generateStructuredOutput() {
      return COVER_PROMPT;
    },
  };
}

function makeImageProvider(localPath?: string): ImageGenerationProvider {
  return createMockImageGenerationProvider({
    localPath,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateAndAttachCoverWorkflow — non-interactive mode', () => {
  it('returns result with generatedImage when generate=true and interactive=false', async () => {
    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
      interactive: false,
    });
    expect(result.coverPrompt).toBeDefined();
    expect(result.generatedImage).toBeDefined();
    expect(select).not.toHaveBeenCalled();
  });

  it('returns a frontmatter patch after the full prompt-generate-upload chain', async () => {
    const aiGenerateStructuredOutput = vi.fn().mockResolvedValue(COVER_PROMPT);
    const aiProvider: TextAIProvider = {
      generateStructuredOutput: aiGenerateStructuredOutput,
    };

    const generatedImage: GeneratedImage = {
      fileName: 'mountain-landscape',
      mimeType: 'image/png',
      buffer: Buffer.from('abc123'),
      localPath: '/tmp/polira-test/mountain-landscape.png',
    };
    const generateImage = vi.fn().mockResolvedValue(generatedImage);
    const imageProvider: ImageGenerationProvider = {
      generateImage,
    };

    const uploadedAsset: UploadedAsset = {
      provider: 'local',
      url: '/images/blog/mountain-landscape.png',
      localPath: '/tmp/polira-test/mountain-landscape.png',
    };
    const upload = vi.fn().mockResolvedValue(uploadedAsset);
    const storageProvider: AssetStorageProvider = {
      upload,
    };

    const result = await generateAndAttachCoverWorkflow(MISSING_META_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider,
      imageProvider,
      storageProvider,
      interactive: false,
    });

    expect(aiGenerateStructuredOutput).toHaveBeenCalledOnce();
    expect(aiGenerateStructuredOutput.mock.calls[0]?.[0].userPrompt).toContain(
      'Title: TanStack Query in Vue',
    );
    expect(aiGenerateStructuredOutput.mock.calls[0]?.[0].userPrompt).toContain(
      'Description: (none)',
    );
    expect(aiGenerateStructuredOutput.mock.calls[0]?.[0].userPrompt).toContain('Slug: (none)');
    expect(generateImage).toHaveBeenCalledOnce();
    expect(generateImage).toHaveBeenCalledWith({
      prompt: 'A scenic mountain landscape at sunrise.',
      fileName: 'mountain-landscape',
      size: '1792x1024',
    });
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith(generatedImage);
    expect(result.generatedImage).toEqual(generatedImage);
    expect(result.uploadedAsset).toEqual(uploadedAsset);
    expect(result.patch).toBeDefined();
    expect(result.patch?.changes).toEqual([
      {
        type: 'frontmatter',
        field: 'cover',
        original: undefined,
        updated: '/images/blog/mountain-landscape.png',
        reason: 'Updated cover',
      },
    ]);
    expect(result.patch?.updatedContent).toContain('cover: /images/blog/mountain-landscape.png');
    expect(result.patch?.updatedContent).toContain('title: TanStack Query in Vue');
    expect(select).not.toHaveBeenCalled();
  });

  it('skips image generation when generate=false', async () => {
    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: false,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      interactive: false,
    });
    expect(result.coverPrompt).toBeDefined();
    expect(result.generatedImage).toBeUndefined();
    expect(select).not.toHaveBeenCalled();
  });
});

describe('generateAndAttachCoverWorkflow — interactive mode', () => {
  it('accepts image when user selects "yes"', async () => {
    vi.mocked(select).mockResolvedValueOnce('yes');

    const storageProvider = createMockAssetStorageProvider({
      localPath: '/tmp/polira-test/mountain-landscape.png',
    });
    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
      storageProvider,
      interactive: true,
    });

    expect(select).toHaveBeenCalledOnce();
    expect(result.generatedImage).toBeDefined();
    expect(result.uploadedAsset).toBeDefined();
  });

  it('returns without patch and clears image fields when user cancels', async () => {
    vi.mocked(select).mockResolvedValueOnce('cancel');

    const storageProvider = createMockAssetStorageProvider({
      localPath: '/tmp/polira-test/mountain-landscape.png',
    });
    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider: makeImageProvider(),
      storageProvider,
      interactive: true,
    });

    expect(select).toHaveBeenCalledOnce();
    expect(result.patch).toBeUndefined();
    expect(result.generatedImage).toBeUndefined();
    expect(result.uploadedAsset).toBeUndefined();
  });

  it('regenerates with feedback when user selects "regenerate" then "yes"', async () => {
    vi.mocked(select).mockResolvedValueOnce('regenerate').mockResolvedValueOnce('yes');
    vi.mocked(input).mockResolvedValueOnce('Make it more vibrant.');

    let callCount = 0;
    let lastPrompt = '';
    const imageProvider: ImageGenerationProvider = {
      async generateImage(params) {
        callCount++;
        lastPrompt = params.prompt;
        return {
          fileName: 'mountain-landscape',
          mimeType: 'image/png',
          buffer: Buffer.from('regenerated-image'),
          localPath: `/tmp/polira-test/mountain-landscape-${callCount}.png`,
        };
      },
    };

    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider,
      interactive: true,
      maxRetries: 3,
    });

    expect(callCount).toBe(2);
    expect(lastPrompt).toContain('Make it more vibrant.');
    expect(select).toHaveBeenCalledTimes(2);
    expect(result.generatedImage).toBeDefined();
  });

  it('auto-accepts after reaching maxRetries', async () => {
    // Always select regenerate to exhaust retries
    vi.mocked(select).mockResolvedValue('regenerate');
    vi.mocked(input).mockResolvedValue('Some feedback');

    const maxRetries = 2;
    let callCount = 0;
    const imageProvider: ImageGenerationProvider = {
      async generateImage() {
        callCount++;
        return {
          fileName: 'mountain-landscape',
          mimeType: 'image/png',
          buffer: Buffer.from('auto-accepted-image'),
        };
      },
    };

    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider,
      interactive: true,
      maxRetries,
    });

    // Should have generated maxRetries + 1 images (initial + retries)
    expect(callCount).toBe(maxRetries + 1);
    // Last select was regenerate but loop ended, so result still has generatedImage
    expect(result.generatedImage).toBeDefined();
  });

  it('does not delete the auto-accepted image when maxRetries is reached', async () => {
    // Always select regenerate to exhaust retries
    vi.mocked(select).mockResolvedValue('regenerate');
    vi.mocked(input).mockResolvedValue('Some feedback');
    vi.mocked(deleteFile).mockResolvedValue(undefined);

    const maxRetries = 2;
    let callCount = 0;
    const imageProvider: ImageGenerationProvider = {
      async generateImage() {
        callCount++;
        return {
          fileName: 'mountain-landscape',
          mimeType: 'image/png',
          buffer: Buffer.from('cleanup-image'),
          localPath: `/tmp/polira-test/mountain-landscape-${callCount}.png`,
        };
      },
    };

    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      generate: true,
      apply: false,
      size: '1792x1024',
      coverField: 'cover',
      aiProvider: makeAiProvider(),
      imageProvider,
      interactive: true,
      maxRetries,
    });

    expect(callCount).toBe(maxRetries + 1);
    expect(result.generatedImage).toBeDefined();

    // The accepted (last) image path must NOT be deleted
    const acceptedPath = `/tmp/polira-test/mountain-landscape-${maxRetries + 1}.png`;
    const deletedPaths = vi.mocked(deleteFile).mock.calls.map((c) => c[0]);
    expect(deletedPaths).not.toContain(acceptedPath);

    // Only the rejected intermediate images should be cleaned up
    expect(deletedPaths).toHaveLength(maxRetries);
    for (let i = 1; i <= maxRetries; i++) {
      expect(deletedPaths).toContain(`/tmp/polira-test/mountain-landscape-${i}.png`);
    }
  });
});
