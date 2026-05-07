import { Command } from 'commander';
import { analyzeDraftWorkflow } from '../../workflows/analyzeDraftWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError, friendlyErrorMessage } from '../../core/errors.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { loadConfig } from '../../core/config.js';

export function registerAnalyzeCommand(program: Command) {
  program
    .command('analyze')
    .description('Parse a Markdown file and print a metadata summary.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--json', 'Output results as JSON')
    .action(async (file: string, opts: { json?: boolean }) => {
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        let aiProvider;

        if (apiKey) {
          const config = await loadConfig();
          aiProvider = createOpenAITextProvider(apiKey, config.ai.textModel);
        }

        const { draft, contentSummary } = await analyzeDraftWorkflow(file, { aiProvider });
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
        logger.label('Draft', frontmatter.draft ? String(frontmatter.draft) : '(not set)');

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

        if (contentSummary) {
          logger.heading('Summary');
          logger.label('Summary', contentSummary.shortSummary);
          logger.label('Key topics', contentSummary.keyTopics.join(', '));
          logger.label('Target audience', contentSummary.targetAudience);
          logger.label('Suggested description', contentSummary.suggestedDescription);
        }

        const criticalFields = [
          frontmatter.title == null ? 'title' : null,
          frontmatter.description == null ? 'description' : null,
        ].filter((f): f is string => f !== null);

        const warningFields = [
          metadata.coverImage == null ? 'cover' : null,
          metadata.tags.length === 0 ? 'tags' : null,
        ].filter((f): f is string => f !== null);

        logger.summary({
          critical: criticalFields.length,
          warning: warningFields.length,
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
