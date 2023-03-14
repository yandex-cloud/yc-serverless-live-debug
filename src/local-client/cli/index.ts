#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import deploy from './deploy';
import run from './run';

yargs(hideBin(process.argv))
  .command('deploy', 'Deploy live-debug components to Yandex cloud', deploy)
  .command('run', 'Run live-debug', run)
  .demandCommand(1)
  .parse();

  // todo: --config
  // todo: --outputs
