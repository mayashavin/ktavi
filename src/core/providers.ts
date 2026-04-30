import type { GeneratedImage, ImageSize, UploadedAsset } from './types.js';

export type TextAIProvider = {
  generateStructuredOutput<TOutput>(input: {
    systemPrompt: string;
    userPrompt: string;
    schemaName: string;
  }): Promise<TOutput>;
};

export type GenerateImageInput = {
  prompt: string;
  fileName: string;
  size?: ImageSize;
};

export type ImageGenerationProvider = {
  generateImage(input: GenerateImageInput): Promise<GeneratedImage>;
};

export type AssetStorageProvider = {
  upload(image: GeneratedImage): Promise<UploadedAsset>;
};
