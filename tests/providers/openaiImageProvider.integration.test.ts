import { describe, it, expect, beforeAll } from 'vitest';
import { createOpenAIImageProvider } from '../../src/providers/image/openaiImageProvider.js';
import type { ImageSize } from '../../src/core/types.js';

const RUN_INTEGRATION = process.env.RUN_OPENAI_INTEGRATION_TESTS === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

describe.skipIf(!RUN_INTEGRATION)(
  'openaiImageProvider — integration (requires RUN_OPENAI_INTEGRATION_TESTS=true)',
  () => {
    beforeAll(() => {
      if (!OPENAI_API_KEY) {
        throw new Error(
          'OPENAI_API_KEY must be set to run OpenAI image provider integration tests.',
        );
      }
    });

    it.each<ImageSize>(['1024x1024', '1536x1024', '1792x1024'])(
      'generates a valid image for size %s',
      async (size) => {
        const provider = createOpenAIImageProvider(OPENAI_API_KEY);

        const result = await provider.generateImage({
          prompt: 'A simple blue circle on a white background.',
          fileName: `test-image-${size}`,
          size,
        });

        expect(result.fileName).toBe(`test-image-${size}`);
        expect(result.mimeType).toBe('image/png');
        expect(result.base64).toBeTruthy();
        expect(typeof result.base64).toBe('string');
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer?.length).toBeGreaterThan(0);
      },
      30_000,
    );
  },
);
