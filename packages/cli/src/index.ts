import { Command } from 'commander';
import chalk from 'chalk';
import { deployCommand } from './commands/deploy.js';
import { contentCommand } from './commands/content.js';
import { accessCommand } from './commands/access.js';

const program = new Command();

program
  .name('content-cli')
  .description(
    chalk.bold('Web3 Content Monetization CLI') +
      '\n  Manage Stacks contracts for pay-per-view, token gating, and subscriptions.'
  )
  .version('1.0.0');

program.addCommand(deployCommand());
program.addCommand(contentCommand());
program.addCommand(accessCommand());

program.parse(process.argv);
