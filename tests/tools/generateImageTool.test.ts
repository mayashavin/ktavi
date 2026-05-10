import { describe, it, expect, vi } from 'vitest';
import { generateImageTool } from '../../src/tools/generate-image/generateImageTool.js';
import type { ImageGenerationProvider } from '../../src/core/providers.js';
import type { CoverPromptResult, ImageSize } from '../../src/core/types.js';

const coverPrompt: CoverPromptResult = {
  visualConcept: 'A futuristic city skyline',
  prompt: 'Generate a futuristic city skyline at dusk.',
  altText: 'Futuristic city skyline at dusk',
  suggestedFilename: 'futuristic-city-skyline',
};

type GenerateImageParams = Parameters<ImageGenerationProvider['generateImage']>[0];

function makeImageProvider(): ImageGenerationProvider & { lastPrompt: string; lastSize: GenerateImageParams['size'] } {
  const provider = {
    lastPrompt: '',
    lastSize: undefined as GenerateImageParams['size'],
    async generateImage(params: GenerateImageParams) {
      provider.lastPrompt = params.prompt;
      provider.lastSize = params.size;
      return {
        fileName: params.fileName,
        mimeType: 'image/png',
        base64: 'abc123',
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
});
