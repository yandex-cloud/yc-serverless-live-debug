/**
 * Run live debug.
 *
 * Dev command:
 * npm run example:run
 */
import fs from 'node:fs';
import { runLocalClient } from '..';
import { logger } from '../../helpers/logger';
import { Arguments, CommandModule } from "yargs";
import { getTerraformPaths } from './helpers';

const CONFIG_FILES = [
  'live-debug.config.ts',
  'live-debug.config.js',
  'live-debug.config.mjs',
  'live-debug.config.cjs',
];

interface RunOptions {
  config?: string
}

const handler = async function (args: Arguments<RunOptions>) {
  const configFile = resolveConfigFile(args);
  const { outputsFile } = getTerraformPaths();
  logger.info(`Running local client...`);
  await runLocalClient({ configFile, outputsFile });
};

function resolveConfigFile(args: Arguments<RunOptions>) {
  let configFile: string | undefined;

  if (args.config) {
    if (!fs.existsSync(args.config)) {
      throw new Error(`Provided config file ${args.config} was not found`);
    }

    configFile = args.config;
  } else {
    configFile = CONFIG_FILES.find(file => fs.existsSync(file));
  }

  if (!configFile) throw new Error(`No live-debug.config.(ts|js) found`);

  logger.info(`Using config: ${configFile}`);

  return configFile;
}

export const runCommand: CommandModule<RunOptions> = {
  command: 'run',
  describe: 'Run live-debug',
  builder: {
    'config': {
      alias: 'c',
      string: true,
    }
  },
  handler: handler,
};
