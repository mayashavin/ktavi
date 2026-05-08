import { select, input } from '@inquirer/prompts';
import type {
  TextAIProvider,
  ImageGenerationProvider,
  AssetStorageProvider,
} from '../core/providers.js';
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
import { deleteFile } from '../utils/fileSystem.js';
import { logger } from '../core/logger.js';

const DEFAULT_MAX_RETRIES = 3;

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
  /** Show an interactive preview/regeneration prompt after generating the image. Default: false. */
  interactive?: boolean;
  /** Maximum number of regeneration attempts allowed. Default: 3. */
  maxRetries?: number;
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
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const rejectedLocalPaths: string[] = [];
    let feedbackContext: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      result.generatedImage = await generateImageTool(
        { prompt: coverPrompt, size: options.size, feedbackContext },
        options.imageProvider,
      );

      if (options.storageProvider && result.generatedImage) {
        result.uploadedAsset = await uploadAssetTool(
          { image: result.generatedImage },
          options.storageProvider,
        );
      }

      if (!options.interactive) {
        break;
      }

      // Show the local path so the user can preview the image
      const localPath = result.uploadedAsset?.localPath ?? result.generatedImage?.localPath;
      if (localPath) {
        logger.info(`Image saved to: ${localPath}`);
      }

      const choice = await select({
        message: 'Happy with this image?',
        choices: [
          { name: 'Yes, accept it', value: 'yes' },
          { name: 'Regenerate with feedback', value: 'regenerate' },
          { name: 'No, cancel', value: 'cancel' },
        ],
      });

      if (choice === 'yes') {
        break;
      }

      if (choice === 'cancel') {
        if (localPath) rejectedLocalPaths.push(localPath);
        result.generatedImage = undefined;
        result.uploadedAsset = undefined;
        break;
      }

      // choice === 'regenerate'
      if (attempt === maxRetries) {
        // Reached the retry limit — accept the last image automatically
        logger.warn(
          `Maximum regeneration attempts (${maxRetries}) reached. Using the last generated image.`,
        );
        break;
      }

      // Mark the current image for cleanup before generating the next one
      if (localPath) rejectedLocalPaths.push(localPath);

      feedbackContext = await input({
        message: 'Describe what you would like to change:',
      });
    }

    // Clean up all rejected local images
    for (const p of rejectedLocalPaths) {
      await deleteFile(p);
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
