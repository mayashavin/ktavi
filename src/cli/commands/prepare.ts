import { Command } from 'commander';
import { prepareDraftWorkflow } from '../../workflows/prepareDraftWorkflow.js';
import { logger } from '../../core/logger.js';
import { KtaviError, friendlyErrorMessage } from '../../core/errors.js';
import { loadConfig } from '../../core/config.js';
import {
  createTextAIProvider,
  createImageProvider,
  createStorageProvider,
} from '../shared/providers.js';
import { renderInlineSuggestion, renderFrontmatterDiff } from '../../utils/diffRenderer.js';
import type { ImageSize, StorageTarget, WritingMode } from '../../core/types.js';

export function registerPrepareCommand(program: Command) {
  program
    .command('prepare')
    .description('Run the full publish-preparation workflow.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--generate-cover', 'Generate a cover image')
    .option('--upload <target>', 'Upload target: cloudinary or none', 'none')
    .option('--save <target>', 'Save target: local or none', 'none')
    .option('--apply', 'Apply safe changes')
    .option('--mode <mode>', 'Writing review mode: light, medium, or strong', 'medium')
    .option('--json', 'Output results as JSON')
    .option('--side-by-side', 'Show diff in side-by-side view')
    .action(
      async (
        file: string,
        opts: {
          generateCover?: boolean;
          upload: string;
          save: string;
          apply?: boolean;
          mode: string;
          json?: boolean;
          sideBySide?: boolean;
        },
      ) => {
        try {
          const config = await loadConfig();
          const aiProvider = createTextAIProvider(config, process.env);

          const storageTarget = (
            opts.upload !== 'none'
              ? opts.upload
              : opts.save !== 'none'
                ? opts.save
                : config.storage.provider
          ) as StorageTarget;
          const storageProvider = createStorageProvider(storageTarget, config, process.env);

          let imageProvider;
          if (opts.generateCover) {
            imageProvider = createImageProvider(config, process.env);
            if (!imageProvider) {
              logger.error(
                'KTAVI_IMAGE_API_KEY is required for image generation. Add it to your .env file.',
              );
              process.exit(1);
            }
          }

          const result = await prepareDraftWorkflow(file, {
            mode: (opts.mode as WritingMode) ?? config.writing.defaultMode,
            apply: opts.apply ?? false,
            generateCover: opts.generateCover ?? false,
            size: config.image.size as ImageSize,
            style: config.image.style,
            coverField: config.markdown.coverField,
            aiProvider,
            imageProvider,
            storageProvider,
          });

          if (opts.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
          }

          logger.heading('Draft Preparation Report');

          logger.heading('Metadata');
          logger.label('Title', result.draft.frontmatter.title ?? '(none)');
          logger.label('Word count', String(result.draft.metadata.wordCount));
          logger.label('Reading time', `~${result.draft.metadata.estimatedReadingTimeMinutes} min`);

          if (result.contentSummary) {
            logger.heading('Content Summary');
            logger.label('Summary', result.contentSummary.shortSummary);
            logger.label('Key topics', result.contentSummary.keyTopics.join(', '));
            logger.label('Target audience', result.contentSummary.targetAudience);
            logger.label('Suggested description', result.contentSummary.suggestedDescription);
          }

          if (result.seoSuggestions.length > 0) {
            logger.heading('SEO Suggestions');
            for (const s of result.seoSuggestions) {
              logger.severity(s.severity, s.field, s.reason);
            }
          }

          if (result.writingSuggestions.length > 0) {
            logger.heading('Writing Suggestions');
            for (const s of result.writingSuggestions) {
              logger.severity('info', s.category, s.reason);
              console.log(renderInlineSuggestion(s.original, s.suggested));
              logger.blank();
            }
          }

          if (result.coverPrompt) {
            logger.heading('Cover Image Concept');
            logger.label('Concept', result.coverPrompt.visualConcept);
            logger.label('Alt text', result.coverPrompt.altText);
          }

          if (result.patch) {
            if (result.patch.changes.length > 0) {
              logger.heading('Field Changes');
              console.log(renderFrontmatterDiff(result.patch.changes));
            }
            if (result.patch.diff) {
              logger.heading('Diff');
              logger.diff(result.patch.diff, { sideBySide: opts.sideBySide });
            }
          }

          if (!opts.apply) {
            logger.info('Run with --apply to write changes.');
          }

          const seoCounts = result.seoSuggestions.reduce(
            (acc, s) => {
              acc[s.severity] = (acc[s.severity] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );
          const totalInfo = (seoCounts['info'] ?? 0) + result.writingSuggestions.length;
          logger.summary({
            critical: seoCounts['critical'],
            warning: seoCounts['warning'],
            info: totalInfo || undefined,
          });

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
