import type { GenerateImageInput, ImageGenerationProvider } from '../../src/core/providers.js';
import type { GeneratedImage } from '../../src/core/types.js';

const TEST_IMAGE_BUFFER = Buffer.from('polira-test-image-buffer');

export function createMockImageGenerationProvider(
  response: Partial<GeneratedImage> = {},
): ImageGenerationProvider {
  return {
    async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
      return {
        fileName: input.fileName,
        mimeType: 'image/png',
        buffer: Buffer.from(TEST_IMAGE_BUFFER),
        ...response,
      };
    },
  };
}
