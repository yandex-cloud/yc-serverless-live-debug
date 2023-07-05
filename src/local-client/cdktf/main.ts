/**
 * Generate terraform declarations for cloud stack.
 */
import path from 'node:path';
import { Construct } from 'constructs';
import { App, AssetType, LocalBackend, TerraformAsset, TerraformOutput, TerraformStack } from 'cdktf';
import { YandexProvider } from '../.gen/providers/yandex/provider';
import { ResourcemanagerFolder } from '../.gen/providers/yandex/resourcemanager-folder';
import { YdbDatabaseServerless } from '../.gen/providers/yandex/ydb-database-serverless';
import { Apigw } from './apigw';
import { Sa } from './sa';
import { Stub } from './stub';
import { Store } from './store';

export type LiveDebugStackConfig = {
  folderName: string;
}

export type LiveDebugStackOutputs = {
  stubId: string;
  apigwHost: string;
}

export function main() {
  const app = new App();

  new LiveDebugStack(app, 'live-debug', {
    folderName: process.env.LIVE_DEBUG_FOLDER_NAME || 'live-debug',
  });

  app.synth();
}

export class LiveDebugStack extends TerraformStack {
  folderId: string;
  sa: Sa;
  ydb: YdbDatabaseServerless;
  stub: Stub;
  store: Store;
  apigw: Apigw;

  constructor(scope: Construct, id: string, protected config: LiveDebugStackConfig) {
    super(scope, id);
    this.initBackend();
    this.initProvider();
    this.folderId = this.getFolderId();
    this.sa = this.createSa();
    this.ydb = this.createYdb();
    this.stub = this.createStub();
    this.store = this.createStore();
    this.apigw = this.createApigw();
    this.createOutputs();
  }

  private initBackend() {
    new LocalBackend(this, {
      path: './terraform.tfstate',
    });
  }

  private initProvider() {
    new YandexProvider(this, 'provider', {
      // Only one of token or service_account_key_file must be specified.
      token: process.env.YC_TOKEN,
      serviceAccountKeyFile: process.env.YC_SERVICE_ACCOUNT_KEY_FILE,
      cloudId: process.env.YC_CLOUD_ID,
    });
  }

  private getFolderId() {
    return process.env.YC_FOLDER_ID ?? new ResourcemanagerFolder(this, 'folder', {
      name: this.config.folderName,
    }).id;
  }

  private createSa() {
    return new Sa(this, 'sa');
  }

  private createStub() {
    return new Stub(this, 'stub', {
      zip: this.createZip('fn-stub'),
    });
  }

  private createStore() {
    return new Store(this, 'store', {
      zip: this.createZip('fn-store'),
    });
  }

  private createApigw() {
    return new Apigw(this, 'apigw');
  }

  private createYdb() {
    return new YdbDatabaseServerless(this, 'ydb', {
      name: 'live-debug-db',
      folderId: this.folderId,
    });
  }

  private createZip(fnDir: string) {
    return new TerraformAsset(this, `zip-${fnDir}`, {
      path: path.resolve(__dirname, fnDir),
      type: AssetType.ARCHIVE,
    });
  }

  private createOutputs() {
    new TerraformOutput(this, 'stubId', {
      value: this.stub.fn.id,
    });

    new TerraformOutput(this, 'apigwHost', {
      value: this.apigw.instance.domain,
    });
  }
}

main();
