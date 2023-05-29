/**
 * Destroy cloud stack with Terraform CDK
 *
 * Dev command:
 * npm run example:destroy
 */

import { execSync } from 'node:child_process';
import { CommandModule } from 'yargs';
import { AutoApproveArg, ensureAuth, ensureCloudId, getAutoApproveOption, getTerraformPaths } from './helpers';

export const destroyCommand: CommandModule<object, AutoApproveArg> = {
  command: 'destroy',
  describe: 'Destroy live-debug components in Yandex cloud',
  builder: {
    ...getAutoApproveOption(),
  },
  handler: ({ autoApprove }) => {
    ensureAuth();
    ensureCloudId();
    destroyStack({ autoApprove });
  },
};

function destroyStack({ autoApprove = false } = {}) {
  const { appPath, output, packageRootDir } = getTerraformPaths();
  const cmd = [
    `npx cdktf destroy`,
    `--app "node ${appPath}"`,
    `--output "${output}"`,
    autoApprove ? `--auto-approve` : '',
  ].filter(Boolean).join(' ');
  execSync(cmd, {
    cwd: packageRootDir,
    stdio: 'inherit',
  });
}
