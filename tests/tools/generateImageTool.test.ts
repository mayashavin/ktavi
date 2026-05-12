import { describe, it, expect, vi } from 'vitest';
import { generateImageTool } from '../../src/tools/generate-image/generateImageTool.js';
import type { ImageGenerationProvider } from '../../src/core/providers.js';
import type { CoverPromptResult, GeneratedImage, ImageSize } from '../../src/core/types.js';

const coverPrompt: CoverPromptResult = {
  visualConcept: 'A futuristic city skyline',
  prompt: 'Generate a futuristic city skyline at dusk.',
  altText: 'Futuristic city skyline at dusk',
  suggestedFilename: 'futuristic-city-skyline',
};

type GenerateImageParams = Parameters<ImageGenerationProvider['generateImage']>[0];

function makeImageProvider(overrides: Partial<GeneratedImage> = {}): ImageGenerationProvider & {
  lastPrompt: string;
  lastFileName: string;
  lastSize: GenerateImageParams['size'];
} {
  const provider = {
    lastPrompt: '',
    lastFileName: '',
    lastSize: undefined as GenerateImageParams['size'],
    async generateImage(params: GenerateImageParams) {
      provider.lastPrompt = params.prompt;
      provider.lastFileName = params.fileName;
      provider.lastSize = params.size;
      return {
        fileName: params.fileName,
        mimeType: 'image/png',
        base64: 'abc123',
        ...overrides,
      };
    },
  };
  return provider;
}

describe('generateImageTool', () => {
  it('uses the prompt as-is when no feedbackContext is provided', async () => {
    const provider = makeImageProvider();
    await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);
    expect(provider.lastPrompt).toBe(coverPrompt.prompt);
  });

  it('appends feedbackContext to the prompt when provided', async () => {
    const provider = makeImageProvider();
    await generateImageTool(
      { prompt: coverPrompt, size: '1792x1024', feedbackContext: 'Make it darker and more moody.' },
      provider,
    );
    expect(provider.lastPrompt).toBe(
      `${coverPrompt.prompt}\n\nUser feedback: Make it darker and more moody.`,
    );
  });

  it('returns the generated image from the provider', async () => {
    const provider = makeImageProvider();
    const result = await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);
    expect(result.fileName).toBe('futuristic-city-skyline');
    expect(result.mimeType).toBe('image/png');
  });

  it.each<ImageSize>(['1024x1024', '1536x1024', '1792x1024'])(
    'forwards size %s to the image provider',
    async (size) => {
      const provider = makeImageProvider();
      await generateImageTool({ prompt: coverPrompt, size }, provider);
      expect(provider.lastSize).toBe(size);
    },
  );

  it('forwards the suggested filename to the image provider', async () => {
    const generateImage = vi.fn().mockResolvedValue({
      fileName: coverPrompt.suggestedFilename,
      mimeType: 'image/png',
      base64: 'abc123',
    });
    const provider: ImageGenerationProvider = { generateImage };

    await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);

    expect(generateImage).toHaveBeenCalledOnce();
    expect(generateImage.mock.calls[0][0].fileName).toBe(coverPrompt.suggestedFilename);
  });

  it('throws IMAGE_GENERATION_FAILED when provider returns no base64 or buffer', async () => {
    const provider = makeImageProvider({ base64: undefined, buffer: undefined });
    await expect(
      generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider),
    ).rejects.toMatchObject({
      name: 'KtaviError',
      code: 'IMAGE_GENERATION_FAILED',
    });
  });

  it('throws IMAGE_GENERATION_FAILED when provider returns an empty base64 string and no buffer', async () => {
    const provider = makeImageProvider({ base64: '', buffer: undefined });
    await expect(
      generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider),
    ).rejects.toMatchObject({
      code: 'IMAGE_GENERATION_FAILED',
    });
  });

  it('accepts a valid buffer when base64 is absent', async () => {
    const provider = makeImageProvider({ base64: undefined, buffer: Buffer.from('image-data') });
    const result = await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);
    expect(result.buffer).toBeDefined();
  });

  it('accepts a valid base64 string when buffer is absent', async () => {
    const provider = makeImageProvider({ base64: 'validbase64data', buffer: undefined });
    const result = await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);
    expect(result.base64).toBe('validbase64data');
  });

  it('uses original filename when attempt is 0', async () => {
    const provider = makeImageProvider();
    await generateImageTool({ prompt: coverPrompt, size: '1792x1024', attempt: 0 }, provider);
    expect(provider.lastFileName).toBe('futuristic-city-skyline');
  });

  it('uses original filename when attempt is not provided', async () => {
    const provider = makeImageProvider();
    await generateImageTool({ prompt: coverPrompt, size: '1792x1024' }, provider);
    expect(provider.lastFileName).toBe('futuristic-city-skyline');
  });

  it('appends attempt suffix to filename when attempt > 0', async () => {
    const provider = makeImageProvider();
    await generateImageTool({ prompt: coverPrompt, size: '1792x1024', attempt: 1 }, provider);
    expect(provider.lastFileName).toBe('futuristic-city-skyline-1');
  });

  it('appends attempt suffix to filename with extension', async () => {
    const promptWithExt: CoverPromptResult = {
      ...coverPrompt,
      suggestedFilename: 'futuristic-city-skyline.png',
    };
    const provider = makeImageProvider();
    await generateImageTool({ prompt: promptWithExt, size: '1792x1024', attempt: 2 }, provider);
    expect(provider.lastFileName).toBe('futuristic-city-skyline-2.png');
  });
});
