import { Command } from 'commander';
import { generateAndAttachCoverWorkflow } from '../../workflows/generateAndAttachCoverWorkflow.js';
import { logger } from '../../core/logger.js';
import { KtaviError, friendlyErrorMessage } from '../../core/errors.js';
import { loadConfig } from '../../core/config.js';
import {
  createTextAIProvider,
  createImageProvider,
  createStorageProvider,
} from '../shared/providers.js';
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
    .option('--json', 'Output results as JSON')
    .option('--autosave', 'Auto-accept generated image without interactive prompts')
    .option('--side-by-side', 'Show diff in side-by-side view')
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
          json?: boolean;
          autosave?: boolean;
          sideBySide?: boolean;
        },
      ) => {
        try {
          const config = await loadConfig();
          const aiProvider = createTextAIProvider(config, process.env);
          if (!aiProvider) {
            logger.error(
              `KTAVI_TEXT_API_KEY (or ${config.ai.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'}) is required for cover generation. Add it to your .env file.`,
            );
            process.exit(1);
          }

          const storageTarget = (opts.upload ??
            opts.save ??
            config.storage.provider) as StorageTarget;
          const storageProvider = createStorageProvider(storageTarget, config, process.env);

          let imageProvider;
          if (opts.generate) {
            imageProvider = createImageProvider(config, process.env);
            if (!imageProvider) {
              logger.error(
                'KTAVI_IMAGE_API_KEY (or OPENAI_API_KEY) is required for image generation. Add it to your .env file.',
              );
              process.exit(1);
            }
          }

          const result = await generateAndAttachCoverWorkflow(file, {
            generate: opts.generate ?? false,
            apply: opts.apply ?? false,
            size: (opts.size as ImageSize) ?? config.image.size,
            style: config.image.style,
            coverField: config.markdown.coverField,
            aiProvider,
            imageProvider,
            storageProvider: opts.generate ? storageProvider : undefined,
            interactive: opts.generate && !opts.autosave,
          });

          if (opts.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
          }

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
            logger.diff(result.patch.diff, { sideBySide: opts.sideBySide });
          }

          logger.blank();
        } catch (err) {
          if (err instanceof KtaviError) {
            logger.error(friendlyErrorMessage(err.code));
            process.exit(1);
          }
          throw err;
        }
      },
    );
}
