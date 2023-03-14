import { TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import { FunctionResource } from '../.gen/providers/yandex/function-resource';
import { LiveDebugStack } from './main';

export interface StoreConfig {
  zip: TerraformAsset
}

export class Store extends Construct {
  fn: FunctionResource;

  constructor(scope: LiveDebugStack, name: string, { zip }: StoreConfig) {
    super(scope, name);

    this.fn = new FunctionResource(this, 'fn', {
      name: 'store',
      description: 'Store ws connections in ydb',
      runtime: 'nodejs16',
      entrypoint: 'fn-store/index.handler',
      memory: 128,
      executionTimeout: '5',
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
