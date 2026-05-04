import { Command } from 'commander';
import { generateAndAttachCoverWorkflow } from '../../workflows/generateAndAttachCoverWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError } from '../../core/errors.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { createOpenAIImageProvider } from '../../providers/image/openaiImageProvider.js';
import { createLocalStorageProvider } from '../../providers/storage/localStorageProvider.js';
import { createCloudinaryStorageProvider } from '../../providers/storage/cloudinaryStorageProvider.js';
import { loadConfig } from '../../core/config.js';
import type { ImageSize, StorageTarget } from '../../core/types.js';

export function registerCoverCommand(program: Command) {
  program
    .command('cover')
    .description('Generate a cover image concept, prompt, and optionally create the image.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--prompt-only', 'Only generate the image prompt')
    .option('--generate', 'Generate the actual cover image')
    .option('--save <target>', 'Save target: local')
    .option('--upload <target>', 'Upload target: cloudinary')
    .option('--apply', 'Apply cover image to frontmatter')
    .option('--size <size>', 'Image size', '1792x1024')
    .action(
      async (
        file: string,
        opts: {
          promptOnly?: boolean;
          generate?: boolean;
          save?: string;
          upload?: string;
          apply?: boolean;
          size: string;
        },
      ) => {
        try {
          const config = await loadConfig();
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            logger.error(
              'OPENAI_API_KEY is required for cover generation. Add it to your .env file.',
            );
            process.exit(1);
          }

          const aiProvider = createOpenAITextProvider(apiKey, config.ai.textModel);

          const storageTarget = (opts.upload ??
            opts.save ??
            config.storage.provider) as StorageTarget;
          const storageProvider =
            storageTarget === 'cloudinary'
              ? createCloudinaryStorageProvider({
                  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
                  apiKey: process.env.CLOUDINARY_API_KEY ?? '',
                  apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
                  folder: config.storage.cloudinary?.folder ?? 'blog-covers',
                })
              : createLocalStorageProvider(
                  config.storage.local?.outputDir ?? './temp/images/blog',
                  config.storage.local?.publicPathPrefix ?? '/images/blog',
                );

          const imageProvider = opts.generate
            ? createOpenAIImageProvider(apiKey, config.ai.imageModel)
            : undefined;

          const result = await generateAndAttachCoverWorkflow(file, {
            generate: opts.generate ?? false,
            apply: opts.apply ?? false,
            size: (opts.size as ImageSize) ?? config.image.size,
            style: config.image.style,
            coverField: config.markdown.coverField,
            aiProvider,
            imageProvider,
            storageProvider: opts.generate ? storageProvider : undefined,
          });

          logger.heading('Cover Image');
          logger.label('Visual concept', result.coverPrompt.visualConcept);
          logger.blank();
          logger.label('Image prompt', result.coverPrompt.prompt);
          logger.blank();
          logger.label('Alt text', result.coverPrompt.altText);
          logger.label('Suggested filename', result.coverPrompt.suggestedFilename);

          if (result.uploadedAsset) {
            logger.heading('Uploaded');
            logger.label('URL', result.uploadedAsset.secureUrl ?? result.uploadedAsset.url);
            if (result.uploadedAsset.localPath) {
              logger.label('Local path', result.uploadedAsset.localPath);
            }
          }

          if (result.patch?.diff) {
            logger.heading('Frontmatter Changes');
            console.log(result.patch.diff);
          }

          logger.blank();
        } catch (err) {
          if (err instanceof PoliraError) {
            logger.error(err.message);
            process.exit(1);
          }
          throw err;
        }
      },
    );
}
