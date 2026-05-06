import { Command } from 'commander';
import { optimizeSeoWorkflow } from '../../workflows/optimizeSeoWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError, friendlyErrorMessage } from '../../core/errors.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { loadConfig } from '../../core/config.js';

export function registerSeoCommand(program: Command) {
  program
    .command('seo')
    .description('Review SEO metadata and suggest improvements.')
    .argument('<file>', 'Path to the Markdown file')
    .option('--json', 'Output results as JSON')
    .option('--apply', 'Apply safe fixes to frontmatter')
    .action(async (file: string, opts: { json?: boolean; apply?: boolean }) => {
      try {
        const config = await loadConfig();
        const apiKey = process.env.OPENAI_API_KEY;
        const aiProvider = apiKey
          ? createOpenAITextProvider(apiKey, config.ai.textModel)
          : undefined;

        const result = await optimizeSeoWorkflow(file, {
          apply: opts.apply,
          aiProvider,
        });

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        logger.heading('SEO Review');

        if (result.suggestions.length === 0) {
          logger.success('No SEO issues found.');
          return;
        }

        for (const s of result.suggestions) {
          logger.severity(s.severity, s.field, s.reason);
          if (s.current) {
            logger.dim(
              `      current: ${Array.isArray(s.current) ? s.current.join(', ') : s.current}`,
            );
          }
          if (s.suggested) {
            logger.dim(
              `      suggested: ${Array.isArray(s.suggested) ? s.suggested.join(', ') : s.suggested}`,
            );
          }
        }

        if (result.patch?.diff) {
          logger.heading('Changes');
          logger.diff(result.patch.diff);
        }

        const counts = result.suggestions.reduce(
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
