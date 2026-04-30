import { Command } from 'commander';
import { logger } from '../../core/logger.js';
import { PoliraError } from '../../core/errors.js';
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
    .action(async (file: string, opts: { apply?: boolean; mode: string }) => {
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
          logger.success('No fixes needed.');
          return;
        }

        logger.heading('Suggested Fixes');
        for (const s of suggestions) {
          const icon = s.severity === 'critical' ? '!' : s.severity === 'warning' ? '?' : 'i';
          console.log(`  [${icon}] ${s.field}: ${s.reason}`);
        }

        if (Object.keys(updates).length > 0) {
          const patch = await updateFrontmatterTool({
            draft,
            updates,
            apply: opts.apply ?? false,
          });

          if (patch.diff) {
            logger.heading('Diff');
            console.log(patch.diff);
          }

          if (opts.apply) {
            logger.success('Fixes applied.');
          } else {
            logger.info('Run with --apply to write changes.');
          }
        }

        logger.blank();
      } catch (err) {
        if (err instanceof PoliraError) {
          logger.error(err.message);
          process.exit(1);
        }
        throw err;
      }
    });
}
