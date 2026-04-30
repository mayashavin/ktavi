#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { registerAnalyzeCommand } from './commands/analyze.js';
import { registerSeoCommand } from './commands/seo.js';
import { registerReviewCommand } from './commands/review.js';
import { registerFixCommand } from './commands/fix.js';
import { registerCoverCommand } from './commands/cover.js';
import { registerPrepareCommand } from './commands/prepare.js';

const program = new Command();

program
  .name('polira')
  .description('A CLI-first AI assistant for preparing Markdown blog drafts for publishing.')
  .version('0.1.0');

registerAnalyzeCommand(program);
registerSeoCommand(program);
registerReviewCommand(program);
registerFixCommand(program);
registerCoverCommand(program);
registerPrepareCommand(program);

program.parse();
