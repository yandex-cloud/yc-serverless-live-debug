/**
 * Deploy cloud stack with Terraform CDK
 *
 *
 * Dev command:
 * npm run example:deploy
 * LIVE_DEBUG_FOLDER_NAME=live-debug-test npm run example:deploy
 *
 * TODO: change location of terraform.live-debug.tfstate to keep project dir cleaner
 */

import { execSync } from 'node:child_process';
import { CommandModule } from 'yargs';
import { ensureAuth, ensureCloudId, getTerraformPaths } from './helpers';

const handler = function () {
  ensureAuth();
  ensureCloudId();
  deployStack();
};

function deployStack() {
  const { appPath, output, outputsFile, packageRootDir } = getTerraformPaths();
  execSync([
    `npx cdktf deploy`,
    `--app "node ${appPath}"`,
    `--output "${output}"`,
    `--outputs-file "${outputsFile}"`,
    ].join(' '), {
    cwd: packageRootDir,
    stdio: 'inherit',
  });
}

export const deployCommand: CommandModule = {
  command: 'deploy',
  describe: 'Deploy live-debug components to Yandex cloud',
  handler: handler,
};
