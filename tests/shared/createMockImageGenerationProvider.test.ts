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

  it('supports response overrides', async () => {
    const provider = createMockImageGenerationProvider({
      fileName: 'custom-image',
      mimeType: 'image/jpeg',
      localPath: '/tmp/polira-test/custom-image.jpg',
    });
    const image = await provider.generateImage({
      prompt: 'A lake at sunset',
      fileName: 'ignored-file-name',
      size: '1024x1024',
    });

    expect(image.fileName).toBe('custom-image');
    expect(image.mimeType).toBe('image/jpeg');
    expect(image.localPath).toBe('/tmp/polira-test/custom-image.jpg');
    expect(image.buffer).toBeInstanceOf(Buffer);
  });
});
