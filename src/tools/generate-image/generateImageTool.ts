import type { ImageGenerationProvider } from '../../core/providers.js';
import type { CoverPromptResult, GeneratedImage, ImageSize } from '../../core/types.js';

export async function generateImageTool(
  input: { prompt: CoverPromptResult; size: ImageSize },
  imageProvider: ImageGenerationProvider,
): Promise<GeneratedImage> {
  return imageProvider.generateImage({
    prompt: input.prompt.prompt,
    fileName: input.prompt.suggestedFilename,
    size: input.size,
  });
}
