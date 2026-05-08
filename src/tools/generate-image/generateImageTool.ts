import type { ImageGenerationProvider } from '../../core/providers.js';
import type { CoverPromptResult, GeneratedImage, ImageSize } from '../../core/types.js';

export async function generateImageTool(
  input: { prompt: CoverPromptResult; size: ImageSize; feedbackContext?: string },
  imageProvider: ImageGenerationProvider,
): Promise<GeneratedImage> {
  const prompt = input.feedbackContext
    ? `${input.prompt.prompt}\n\nUser feedback: ${input.feedbackContext}`
    : input.prompt.prompt;

  return imageProvider.generateImage({
    prompt,
    fileName: input.prompt.suggestedFilename,
    size: input.size,
  });
}
