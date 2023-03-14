import fs from 'node:fs';
import path from 'node:path';
import { ApiGateway } from '../.gen/providers/yandex/api-gateway';
import { LiveDebugStack } from './main';
import { Construct } from 'constructs';

export class Apigw extends Construct {
  title = 'live-debug-apigw';
  instance: ApiGateway;

  constructor(private scope: LiveDebugStack, name: string) {
    super(scope, name);

    this.instance = new ApiGateway(this, 'gateway', {
      name: this.title,
      description: 'API gateway to hold WS connections and accept stub function requests',
      folderId: scope.folder.id,
      spec: this.createSpec(),
    });
  }

  private createSpec() {
    const specFile = path.resolve(__dirname, 'apigw.tpl.yaml');
    const specTpl = fs.readFileSync(specFile, 'utf8');
    return withParams(specTpl, {
      title: this.title,
      sa_id: this.scope.sa.id,
      store_fn_id: this.scope.store.fn.id,
      stub_fn_id: this.scope.stub.fn.id,
    });
  }
}

function withParams(template: string, obj: Record<string, unknown>) {
  return template.replace(/<%(.*?)%>/g, (_, key) => String(obj[key.trim()]));
}
