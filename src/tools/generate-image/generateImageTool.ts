import path from 'node:path';
import type { ImageGenerationProvider } from '../../core/providers.js';
import type { CoverPromptResult, GeneratedImage, ImageSize } from '../../core/types.js';

export async function generateImageTool(
  input: { prompt: CoverPromptResult; size: ImageSize; feedbackContext?: string; attempt?: number },
  imageProvider: ImageGenerationProvider,
): Promise<GeneratedImage> {
  const prompt = input.feedbackContext
    ? `${input.prompt.prompt}\n\nUser feedback: ${input.feedbackContext}`
    : input.prompt.prompt;

  let fileName = input.prompt.suggestedFilename;
  if (input.attempt && input.attempt > 0) {
    const parsed = path.parse(fileName);
    fileName = `${parsed.name}-${input.attempt}${parsed.ext}`;
  }

  return imageProvider.generateImage({
    prompt,
    fileName,
    size: input.size,
  });
}
