import { describe, it, expect } from 'vitest';
import { createOpenAIImageProvider } from '../../../src/providers/image/openaiImageProvider.js';
import { KtaviError } from '../../../src/core/errors.js';

const RUN_INTEGRATION = process.env.RUN_OPENAI_IMAGE_INTEGRATION_TESTS === 'true';
const apiKey = process.env.OPENAI_API_KEY ?? '';

describe('openaiImageProvider', () => {
  it('throws KtaviError when API key is empty', () => {
    expect(() => createOpenAIImageProvider('')).toThrow(KtaviError);
    expect(() => createOpenAIImageProvider('')).toThrow('KTAVI_IMAGE_API_KEY');

    try {
      createOpenAIImageProvider('');
    } catch (error) {
      expect(error).toBeInstanceOf(KtaviError);
      expect((error as KtaviError).code).toBe('AI_PROVIDER_ERROR');
    }
  });
});

describe.skipIf(!RUN_INTEGRATION)('openaiImageProvider (integration)', () => {
  it('generates an image and returns a valid GeneratedImage', { timeout: 30_000 }, async () => {
    const provider = createOpenAIImageProvider(apiKey);

    const result = await provider.generateImage({
      prompt:
        'A simple flat-design icon of a blue mountain peak on a white background, minimal style',
      fileName: 'test-mountain-icon',
      size: '1024x1024',
    });

    expect(result.fileName).toBe('test-mountain-icon');
    expect(result.mimeType).toBe('image/png');
    expect(typeof result.base64).toBe('string');
    expect(result.base64!.length).toBeGreaterThan(0);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer!.length).toBeGreaterThan(0);
  });
});
