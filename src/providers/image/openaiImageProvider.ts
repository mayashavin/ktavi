import type { ImageGenerationProvider, GenerateImageInput } from '../../core/providers.js';
import type { GeneratedImage } from '../../core/types.js';
import { PoliraError } from '../../core/errors.js';

export function createOpenAIImageProvider(apiKey: string, model?: string): ImageGenerationProvider {
  if (!apiKey) {
    throw new PoliraError(
      'OPENAI_API_KEY is not set. Please add it to your .env file.',
      'AI_PROVIDER_ERROR',
    );
  }

  return {
    async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });

      const response = await client.images.generate({
        model: model ?? 'gpt-image-2',
        prompt: input.prompt,
        size: input.size ?? '1792x1024',
        n: 1,
      });

      const imageData = response.data?.[0]?.b64_json;
      if (!imageData) {
        throw new PoliraError('No image data returned from provider.', 'IMAGE_GENERATION_FAILED');
      }

      const buffer = Buffer.from(imageData, 'base64');
      return {
        fileName: input.fileName,
        mimeType: 'image/png',
        base64: imageData,
        buffer,
      };
    },
  };
}
