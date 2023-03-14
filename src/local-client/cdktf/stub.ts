/**
 * Stub function.
 */
import { TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import { FunctionResource } from '../.gen/providers/yandex/function-resource';
import { LiveDebugStack } from './main';

export interface StubConfig {
  zip: TerraformAsset
}

export class Stub extends Construct {
  fn: FunctionResource;

  constructor(scope: LiveDebugStack, name: string, { zip }: StubConfig) {
    super(scope, name);

    this.fn = new FunctionResource(this, 'fn', {
      name: 'stub',
      description: 'Proxy requests to local code for live debug',
      runtime: 'nodejs16',
      entrypoint: 'fn-stub/index.handler',
      memory: 128,
      executionTimeout: '60',
      folderId: scope.folder.id,
      serviceAccountId: scope.sa.id,
      userHash: zip.assetHash,
      content: {
        zipFilename: zip.path,
      },
      environment: {
        YDB_PATH: scope.ydb.databasePath,
      },
    });
  }
}
