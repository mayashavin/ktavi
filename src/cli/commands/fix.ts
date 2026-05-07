import { Command } from 'commander';
import { logger } from '../../core/logger.js';
import { PoliraError, friendlyErrorMessage } from '../../core/errors.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { loadConfig } from '../../core/config.js';
import { parseMarkdownTool } from '../../tools/parse-markdown/index.js';
import { reviewSeoTool } from '../../tools/review-seo/index.js';
import { updateFrontmatterTool } from '../../tools/update-frontmatter/index.js';

export function registerFixCommand(program: Command) {
  program
    .command('fix')
    .description('Generate and show suggested fixes with diffs.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--apply', 'Apply safe fixes')
    .option('--mode <mode>', 'Review mode: light, medium, or strong', 'medium')
    .option('--json', 'Output results as JSON')
    .action(async (file: string, opts: { apply?: boolean; mode: string; json?: boolean }) => {
      try {
        const config = await loadConfig();
        const apiKey = process.env.OPENAI_API_KEY;
        const aiProvider = apiKey
          ? createOpenAITextProvider(apiKey, config.ai.textModel)
          : undefined;

        const draft = await parseMarkdownTool({ filePath: file });
        const { suggestions } = await reviewSeoTool({ draft }, aiProvider);

        const updates: Record<string, unknown> = {};
        for (const s of suggestions) {
          if (s.suggested && s.severity === 'critical' && typeof s.suggested === 'string') {
            updates[s.field] = s.suggested;
          }
        }

        if (Object.keys(updates).length === 0 && suggestions.length === 0) {
          if (opts.json) {
            console.log(JSON.stringify({ suggestions: [], patch: null }, null, 2));
            return;
          }
          logger.success('No fixes needed.');
          return;
        }

        let patch = null;
        if (Object.keys(updates).length > 0) {
          patch = await updateFrontmatterTool({
            draft,
            updates,
            apply: opts.apply ?? false,
          });
        }

        if (opts.json) {
          console.log(JSON.stringify({ suggestions, patch }, null, 2));
          return;
        }

        logger.heading('Suggested Fixes');
        for (const s of suggestions) {
          logger.severity(s.severity, s.field, s.reason);
        }

        if (patch?.diff) {
          logger.heading('Diff');
          logger.diff(patch.diff);
        }

        if (Object.keys(updates).length > 0) {
          if (opts.apply) {
            logger.success('Fixes applied.');
          } else {
            logger.info('Run with --apply to write changes.');
          }
        }

        const counts = suggestions.reduce(
          (acc, s) => {
            acc[s.severity] = (acc[s.severity] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        logger.summary({
          critical: counts['critical'],
          warning: counts['warning'],
          info: counts['info'],
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
