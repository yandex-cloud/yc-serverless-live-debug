/**
 * Run live debug.
 *
 * Dev command:
 * npm run example:run
 */
import fs from 'node:fs';
import path from 'node:path';
import { runLocalClient } from '..';
import { logger } from '../../helpers/logger';

const CONFIG_FILES = [
  'live-debug.config.ts',
  'live-debug.config.js',
  'live-debug.config.mjs',
  'live-debug.config.cjs',
];

export default async function () {
  const configFile = resolveConfigFile();
  const outputsFile = resolveOutputsFile();
  logger.info(`Running local client...`);
  await runLocalClient({ configFile, outputsFile });
}

function resolveConfigFile() {
  // todo: allow custom config via --config option
  const configFile = CONFIG_FILES.find(file => fs.existsSync(file));
  if (!configFile) throw new Error(`No live-debug.config.(ts|js) found`);
  logger.info(`Using config: ${configFile}`);
  return configFile;
}

function resolveOutputsFile() {
  // todo: allow custom path to outputs via --outputs option
  return path.resolve('.live-debug', 'outputs.json');
}

