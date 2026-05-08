import { describe, it, expect } from 'vitest';
import { generateImageTool } from '../../src/tools/generate-image/generateImageTool.js';
import type { ImageGenerationProvider } from '../../src/core/providers.js';
import type { CoverPromptResult } from '../../src/core/types.js';

const coverPrompt: CoverPromptResult = {
  visualConcept: 'A futuristic city skyline',
  prompt: 'Generate a futuristic city skyline at dusk.',
  altText: 'Futuristic city skyline at dusk',
  suggestedFilename: 'futuristic-city-skyline',
};

function makeImageProvider(): ImageGenerationProvider & { lastPrompt: string } {
  const provider = {
    lastPrompt: '',
    async generateImage(params: { prompt: string; fileName: string; size: string }) {
      provider.lastPrompt = params.prompt;
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
});
