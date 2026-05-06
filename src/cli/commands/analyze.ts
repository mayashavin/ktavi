import { Command } from 'commander';
import { analyzeDraftWorkflow } from '../../workflows/analyzeDraftWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError, friendlyErrorMessage } from '../../core/errors.js';

export function registerAnalyzeCommand(program: Command) {
  program
    .command('analyze')
    .description('Parse a Markdown file and print a metadata summary.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--json', 'Output results as JSON')
    .action(async (file: string, opts: { json?: boolean }) => {
      try {
        const { draft } = await analyzeDraftWorkflow(file);
        const { metadata, frontmatter } = draft;

        if (opts.json) {
          console.log(JSON.stringify({ draft }, null, 2));
          return;
        }

        logger.heading('Draft Analysis');

        logger.heading('Frontmatter');
        logger.label('Title', frontmatter.title ?? '(none)');
        logger.label('Description', frontmatter.description ?? '(none)');
        logger.label('Slug', frontmatter.slug ?? '(none)');
        logger.label('Tags', metadata.tags.length > 0 ? metadata.tags.join(', ') : '(none)');
        logger.label('Cover', metadata.coverImage ?? '(none)');
        logger.label(
          'Draft',
          frontmatter.draft !== undefined ? String(frontmatter.draft) : '(not set)',
        );

        logger.heading('Content');
        logger.label('Word count', String(metadata.wordCount));
        logger.label('Reading time', `~${metadata.estimatedReadingTimeMinutes} min`);
        logger.label('Headings', String(metadata.headings.length));
        logger.label('Links', String(metadata.links.length));
        logger.label('Images', String(metadata.images.length));

        if (metadata.headings.length > 0) {
          logger.heading('Headings');
          for (const h of metadata.headings) {
            logger.dim(`  ${'#'.repeat(h.depth)} ${h.text}`);
          }
        }

        if (metadata.images.length > 0) {
          logger.heading('Images');
          for (const img of metadata.images) {
            logger.dim(`  ${img.url}${img.alt ? ` (alt: ${img.alt})` : ' (no alt text)'}`);
          }
        }

        const missingFields = [
          !frontmatter.title && 'title',
          !frontmatter.description && 'description',
          !metadata.coverImage && 'cover',
          metadata.tags.length === 0 && 'tags',
        ].filter(Boolean) as string[];

        logger.summary({
          critical: missingFields.length,
        });

        logger.blank();
      } catch (err) {
        if (err instanceof PoliraError) {
          logger.error(friendlyErrorMessage(err.code));
          process.exit(1);
        }
        throw err;
      }
    });
}
