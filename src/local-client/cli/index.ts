#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { deployCommand } from './deploy';
import { runCommand } from './run';
import { destroyCommand } from './destroy';

yargs(hideBin(process.argv))
  .command(deployCommand)
  .command(runCommand)
  .command(destroyCommand)
  .demandCommand(1)
  .parse();

  // todo: --config
  // todo: --outputs
