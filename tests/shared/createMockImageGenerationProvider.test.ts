import { describe, expect, it } from 'vitest';
import { createMockImageGenerationProvider } from './createMockImageGenerationProvider.js';

describe('createMockImageGenerationProvider', () => {
  it('returns a generated image with a test buffer by default', async () => {
    const provider = createMockImageGenerationProvider();
    const image = await provider.generateImage({
      prompt: 'A mountain at sunrise',
      fileName: 'mountain',
      size: '1792x1024',
    });

    expect(image.fileName).toBe('mountain');
    expect(image.mimeType).toBe('image/png');
    expect(image.buffer).toBeInstanceOf(Buffer);
    expect(image.buffer?.length).toBeGreaterThan(0);
  });
});
