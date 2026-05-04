import { Command } from 'commander';
import { resolveConfigWithSources } from '../../core/config.js';
import type { ConfigSource } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { runConfigInit } from './configInit.js';
import type { ConfigInitOptions } from './configInit.js';

const SOURCE_LABELS: Record<ConfigSource, string> = {
  default: 'default',
  global: 'global',
  project: 'project',
};

export function registerConfigCommand(program: Command) {
  const configCmd = program.command('config').description('View and manage Polira configuration');

  configCmd
    .command('show')
    .description('Display the fully resolved configuration with sources')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      const resolved = await resolveConfigWithSources();

      if (opts.json) {
        console.log(JSON.stringify(resolved.config, null, 2));
        return;
      }

      logger.heading('Config sources');
      const globalStatus = resolved.paths.global.loaded ? 'loaded' : 'not found';
      const projectStatus = resolved.paths.project.loaded ? 'loaded' : 'not found';
      logger.label('Global', `${resolved.paths.global.path} (${globalStatus})`);
      logger.label('Project', `${resolved.paths.project.path} (${projectStatus})`);

      const sections: Record<string, string[]> = {};
      for (const [key, { value, source }] of Object.entries(resolved.sources)) {
        const sectionKey = key.split('.')[0];
        if (!sections[sectionKey]) sections[sectionKey] = [];

        const displayValue = value === undefined ? '—' : String(value);
        const sourceTag = SOURCE_LABELS[source];
        sections[sectionKey].push(
          `    ${key.padEnd(30)} ${displayValue.padEnd(24)} (${sourceTag})`,
        );
      }

      for (const [section, lines] of Object.entries(sections)) {
        logger.heading(section);
        for (const line of lines) {
          console.log(line);
        }
      }

      logger.blank();
    });

  configCmd
    .command('init')
    .description('Interactively create a polira config file')
    .option('--global', 'Create global config at ~/.config/polira/config.js')
    .option('--force', 'Overwrite existing config without confirmation')
    .option('--defaults', 'Skip prompts and write default config')
    .action(async (opts: ConfigInitOptions) => {
      await runConfigInit(opts);
    });
}
