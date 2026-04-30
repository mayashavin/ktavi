import { Command } from 'commander';
import { reviewDraftWorkflow } from '../../workflows/reviewDraftWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError } from '../../core/errors.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { loadConfig } from '../../core/config.js';
import type { WritingMode } from '../../core/types.js';

export function registerReviewCommand(program: Command) {
  program
    .command('review')
    .description('Review writing quality and suggest improvements.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--mode <mode>', 'Review mode: light, medium, or strong', 'medium')
    .option('--json', 'Output results as JSON')
    .action(async (file: string, opts: { mode: string; json?: boolean }) => {
      try {
        const config = await loadConfig();
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          logger.error('OPENAI_API_KEY is required for writing review. Add it to your .env file.');
          process.exit(1);
        }

        const aiProvider = createOpenAITextProvider(apiKey, config.ai.textModel);
        const mode = (opts.mode as WritingMode) ?? config.writing.defaultMode;
        const result = await reviewDraftWorkflow(file, mode, aiProvider);

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        logger.heading('Writing Review');

        if (result.suggestions.length === 0) {
          logger.success('No writing suggestions.');
          return;
        }

        for (const s of result.suggestions) {
          console.log(`  [${s.category}] ${s.reason} (confidence: ${(s.confidence * 100).toFixed(0)}%)`);
          logger.dim(`    - ${s.original}`);
          logger.dim(`    + ${s.suggestion}`);
          logger.blank();
        }
      } catch (err) {
        if (err instanceof PoliraError) {
          logger.error(err.message);
          process.exit(1);
        }
        throw err;
      }
    });
}
