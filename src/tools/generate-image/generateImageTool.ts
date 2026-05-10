import type { ImageGenerationProvider } from '../../core/providers.js';
import type { CoverPromptResult, GeneratedImage, ImageSize } from '../../core/types.js';
import { KtaviError } from '../../core/errors.js';

export async function generateImageTool(
  input: { prompt: CoverPromptResult; size: ImageSize; feedbackContext?: string },
  imageProvider: ImageGenerationProvider,
): Promise<GeneratedImage> {
  const prompt = input.feedbackContext
    ? `${input.prompt.prompt}\n\nUser feedback: ${input.feedbackContext}`
    : input.prompt.prompt;

  const image = await imageProvider.generateImage({
    prompt,
    fileName: input.prompt.suggestedFilename,
    size: input.size,
  });

  const hasBase64 = typeof image.base64 === 'string' && image.base64.length > 0;
  const hasBuffer = Buffer.isBuffer(image.buffer) && image.buffer.length > 0;

  if (!hasBase64 && !hasBuffer) {
    throw new KtaviError(
      'Image generation returned no valid base64 or buffer data.',
      'IMAGE_GENERATION_FAILED',
    );
  }

  return image;
}
