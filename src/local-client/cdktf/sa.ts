import { LiveDebugStack } from './main';
import { IamServiceAccount } from '../.gen/providers/yandex/iam-service-account';
import { ResourcemanagerFolderIamBinding } from '../.gen/providers/yandex/resourcemanager-folder-iam-binding';
import { Construct } from 'constructs';

export class Sa extends Construct {
  instance: IamServiceAccount;

  constructor(private scope: LiveDebugStack, name: string) {
    super(scope, name);
    this.instance = new IamServiceAccount(this, 'sa', {
      // sa name should be unique
      name: `sa-live-debug-${this.scope.folderId}`,
      description: 'Service account for live debug',
      folderId: this.scope.folderId,
    });
    this.createRoles([
      'serverless.functions.invoker',
      'ydb.editor',
      'api-gateway.websocketWriter',
    ]);
  }

  get id() {
    return this.instance.id;
  }

  private createRoles(roles: string[]) {
    roles.forEach(role => {
      new ResourcemanagerFolderIamBinding(this, role, {
        members: [ `serviceAccount:${this.id}` ],
        folderId: this.scope.folderId,
        role,
      });
    });
  }
}
