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

import path from 'node:path';
import { execSync } from 'node:child_process';

export default function () {
  ensureAuth();
  ensureCloudId();
  deployStack();
}

function deployStack() {
  const cwd = path.resolve(__dirname, '..', '..', '..');
  // todo: for debug it's useful to use ts-node and ./main.ts
  const appPath = path.resolve(__dirname, '..', 'cdktf', 'main.js');
  // keep outputs in user's project dir to not depend on node_modules deletion
  const output = path.resolve('.live-debug');
  const outputsFile = path.resolve('.live-debug', 'outputs.json');
  execSync([
    `npx cdktf deploy`,
    `--app "node ${appPath}"`,
    `--output "${output}"`,
    `--outputs-file "${outputsFile}"`,
    ].join(' '), {
    cwd,
    stdio: 'inherit',
  });
}

function ensureAuth() {
  if (!process.env.YC_TOKEN && !process.env.YC_SERVICE_ACCOUNT_KEY_FILE) {
    process.env.YC_TOKEN = getCmdOutput('yc iam create-token');
  }
}

function ensureCloudId() {
  if (!process.env.YC_CLOUD_ID) {
    process.env.YC_CLOUD_ID = getCmdOutput('yc config get cloud-id');
  }
}

function getCmdOutput(cmd: string) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}
