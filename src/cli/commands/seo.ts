import { Command } from 'commander';
import { optimizeSeoWorkflow } from '../../workflows/optimizeSeoWorkflow.js';
import { logger } from '../../core/logger.js';
import { PoliraError } from '../../core/errors.js';
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
          const icon = s.severity === 'critical' ? '!' : s.severity === 'warning' ? '?' : 'i';
          const color = s.severity === 'critical' ? '\x1b[31m' : s.severity === 'warning' ? '\x1b[33m' : '\x1b[36m';
          console.log(`  ${color}[${icon}]\x1b[0m ${s.field}: ${s.reason}`);
          if (s.current) {
            logger.dim(`      current: ${Array.isArray(s.current) ? s.current.join(', ') : s.current}`);
          }
          if (s.suggested) {
            logger.dim(`      suggested: ${Array.isArray(s.suggested) ? s.suggested.join(', ') : s.suggested}`);
          }
        }

        if (result.patch?.diff) {
          logger.heading('Changes');
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
    });
}
