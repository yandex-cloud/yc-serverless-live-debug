import { Handler } from '@yandex-cloud/function-types';

export const handler: Handler.Http = async event => {
  const headers = JSON.stringify(event.headers, null, 2);
  return {
    statusCode: 200,
    body: `Hello from local code! Your headers: ${headers}`,
  };
}
