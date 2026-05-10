import { describe, it, expect } from 'vitest';
import { generateImageTool } from '../../src/tools/generate-image/generateImageTool.js';
import type { ImageGenerationProvider } from '../../src/core/providers.js';
import type { CoverPromptResult, GeneratedImage } from '../../src/core/types.js';

const coverPrompt: CoverPromptResult = {
  visualConcept: 'A futuristic city skyline',
  prompt: 'Generate a futuristic city skyline at dusk.',
  altText: 'Futuristic city skyline at dusk',
  suggestedFilename: 'futuristic-city-skyline',
};

function makeImageProvider(
  overrides?: Partial<GeneratedImage>,
): ImageGenerationProvider & { lastPrompt: string } {
  const provider = {
    lastPrompt: '',
    async generateImage(params: { prompt: string; fileName: string; size: string }) {
      provider.lastPrompt = params.prompt;
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
});
