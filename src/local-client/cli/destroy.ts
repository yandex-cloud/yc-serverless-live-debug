/**
 * Destroy cloud stack with Terraform CDK
 *
 * Dev command:
 * npm run example:destroy
 */

import { execSync } from 'node:child_process';
import { CommandModule } from 'yargs';
import { ensureAuth, ensureCloudId, getTerraformPaths } from './helpers';

const handler = function () {
  ensureAuth();
  ensureCloudId();
  destroyStack();
};

function destroyStack() {
  const { appPath, output, packageRootDir } = getTerraformPaths();
  execSync([
    `npx cdktf destroy`,
    `--app "node ${appPath}"`,
    `--output "${output}"`,
    ].join(' '), {
    cwd: packageRootDir,
    stdio: 'inherit',
  });
}

export const destroyCommand: CommandModule = {
  command: 'destroy',
  describe: 'Destroy live-debug components in Yandex cloud',
  handler,
};
