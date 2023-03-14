import { Handler } from '@yandex-cloud/function-types';
import { defineConfig } from '../src/local-client';

export default defineConfig({
  handler: <Handler.Http>(event => {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return {
      statusCode: 200,
      body: `Response: ${body}`
    };
  }),
});
