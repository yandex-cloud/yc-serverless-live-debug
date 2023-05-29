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
import { getAutoApproveOption, ensureAuth, ensureCloudId, getTerraformPaths, AutoApproveArg } from './helpers';

export const deployCommand: CommandModule<object, AutoApproveArg> = {
  command: 'deploy',
  describe: 'Deploy live-debug components to Yandex cloud',
  builder: {
    ...getAutoApproveOption(),
  },
  handler: ({ autoApprove }) => {
    ensureAuth();
    ensureCloudId();
    deployStack({ autoApprove });
  },
};

function deployStack({ autoApprove = false } = {}) {
  const { appPath, output, outputsFile, packageRootDir } = getTerraformPaths();
  const cmd = [
    `npx cdktf deploy`,
    `--app "node ${appPath}"`,
    `--output "${output}"`,
    `--outputs-file "${outputsFile}"`,
    autoApprove ? `--auto-approve` : '',
  ].filter(Boolean).join(' ');
  execSync(cmd, {
    cwd: packageRootDir,
    stdio: 'inherit',
  });
}
