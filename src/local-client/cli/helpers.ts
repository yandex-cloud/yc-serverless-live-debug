import path from 'node:path';
import { execSync } from 'node:child_process';

export function ensureAuth() {
  if (!process.env.YC_TOKEN && !process.env.YC_SERVICE_ACCOUNT_KEY_FILE) {
    process.env.YC_TOKEN = getCmdOutput('yc iam create-token');
  }
}

export function ensureCloudId() {
  if (!process.env.YC_CLOUD_ID) {
    process.env.YC_CLOUD_ID = getCmdOutput('yc config get cloud-id');
  }
}

export function getTerraformPaths() {
  return {
    packageRootDir: path.resolve(__dirname, '..'),
    appPath: path.resolve(__dirname, './cdktf.js'),
    // keep terraform outputs in user's project dir to not depend on node_modules deletion
    output: path.resolve('.live-debug'),
    outputsFile: path.resolve('.live-debug', 'outputs.json'),
  };
}

function getCmdOutput(cmd: string) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}
