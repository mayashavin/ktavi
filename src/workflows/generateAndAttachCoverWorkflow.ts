import type { TextAIProvider, ImageGenerationProvider, AssetStorageProvider } from '../core/providers.js';
import type {
  CoverPromptResult,
  DraftPatch,
  GeneratedImage,
  ImageSize,
  UploadedAsset,
  CoverFieldName,
} from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';
import { generateCoverPromptTool } from '../tools/generate-cover-prompt/index.js';
import { generateImageTool } from '../tools/generate-image/index.js';
import { uploadAssetTool } from '../tools/upload-asset/index.js';
import { updateFrontmatterTool } from '../tools/update-frontmatter/index.js';

export type GenerateAndAttachCoverResult = {
  coverPrompt: CoverPromptResult;
  generatedImage?: GeneratedImage;
  uploadedAsset?: UploadedAsset;
  patch?: DraftPatch;
};

export type GenerateAndAttachCoverOptions = {
  generate: boolean;
  apply: boolean;
  size: ImageSize;
  style?: string;
  coverField: CoverFieldName;
  aiProvider: TextAIProvider;
  imageProvider?: ImageGenerationProvider;
  storageProvider?: AssetStorageProvider;
};

export async function generateAndAttachCoverWorkflow(
  filePath: string,
  options: GenerateAndAttachCoverOptions,
): Promise<GenerateAndAttachCoverResult> {
  const draft = await parseMarkdownTool({ filePath });

  const coverPrompt = await generateCoverPromptTool(
    { draft, style: options.style },
    options.aiProvider,
  );

  const result: GenerateAndAttachCoverResult = { coverPrompt };

  if (options.generate && options.imageProvider) {
    result.generatedImage = await generateImageTool(
      { prompt: coverPrompt, size: options.size },
      options.imageProvider,
    );

    if (options.storageProvider && result.generatedImage) {
      result.uploadedAsset = await uploadAssetTool(
        { image: result.generatedImage },
        options.storageProvider,
      );
    }
  }

  if (result.uploadedAsset) {
    const coverUrl = result.uploadedAsset.secureUrl ?? result.uploadedAsset.url;
    result.patch = await updateFrontmatterTool({
      draft,
      updates: { [options.coverField]: coverUrl },
      apply: options.apply,
    });
  }

  return result;
}
