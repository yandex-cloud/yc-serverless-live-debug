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
  folder: ResourcemanagerFolder;
  sa: Sa;
  ydb: YdbDatabaseServerless;
  stub: Stub;
  store: Store;
  apigw: Apigw;

  constructor(scope: Construct, id: string, protected config: LiveDebugStackConfig) {
    super(scope, id);
    this.initBackend();
    this.initProvider();
    this.folder = this.createFolder();
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
      token: process.env.YC_TOKEN,
      serviceAccountKeyFile: process.env.YC_SERVICE_ACCOUNT_KEY_FILE,
      cloudId: process.env.YC_CLOUD_ID,
    });
  }

  private createFolder() {
    return new ResourcemanagerFolder(this, 'folder', {
      name: this.config.folderName,
    });
  }

  private createSa() {
    return new Sa(this, 'sa');
  }

  private createStub() {
    return new Stub(this, 'stub', {
      zip: this.createZip('fn-stub-zip'),
    });
  }

  private createStore() {
    return new Store(this, 'store', {
      zip: this.createZip('fn-store-zip'),
    });
  }

  private createApigw() {
    return new Apigw(this, 'apigw');
  }

  private createYdb() {
    return new YdbDatabaseServerless(this, 'ydb', {
      name: 'live-debug-db',
      folderId: this.folder.id,
    });
  }

  private createZip(fnDir: string) {
    return new TerraformAsset(this, `zip-${fnDir}`, {
      path: path.resolve(__dirname, '..', '..', '..', 'dist', fnDir),
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
