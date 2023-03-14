# yc-serverless-live-debug
Live debug of Yandex Cloud Functions in Node.js.

<!-- toc -->

- [How it works](#how-it-works)
- [Setup](#setup)
- [Usage](#usage)
    + [Debug single function](#debug-single-function)
    + [Debug several functions](#debug-several-functions)
    + [Debug other triggers](#debug-other-triggers)
- [Watch](#watch)

<!-- tocstop -->

## How it works
![diagram](https://user-images.githubusercontent.com/1473072/221630804-855844d9-7b38-40ed-a5ce-b62939d65ae1.png)

Main components:
1. `stub` - cloud function that proxies requests to local code
2. `store` - cloud function that stores WebSocket connections info in YDB. This connection info is later used by `stub` to know where to proxy request
3. `client` - CLI app running on local machine and handling requests coming by WebSocket

> The schema was inspired by [SST Live Lambda Dev](https://docs.sst.dev/live-lambda-development)

## Setup
Ensure that you have [Terraform installed](https://cloud.yandex.ru/docs/tutorials/infrastructure-management/terraform-quickstart).

1. Install package:
    ```
    npm i -D @yandex-cloud/sls-live-debug
    ```

2. Deploy cloud components:
    ```
    npx sls-live-debug deploy
    ```
    Review terraform plan and press **Approve**.

    > By default this command uses [yc cli](https://cloud.yandex.ru/docs/cli/) to get auth token and cloud id. You can manually set these values by `YC_TOKEN` and `YC_CLOUD_ID` env vars

    > To authorize by service account key use `YC_SERVICE_ACCOUNT_KEY_FILE` env var:

    ```
    YC_SERVICE_ACCOUNT_KEY_FILE=path/to/key.json npx sls-live-debug deploy
    ```

    > By default all components will be created in separate cloud catalogue `live-debug`. You can change this name using `LIVE_DEBUG_FOLDER_NAME` env var:
    ```
    LIVE_DEBUG_FOLDER_NAME=live-debug-test npx sls-live-debug deploy
    ```

3. Create `live-debug.config.ts` in project root:
    ```ts
    import { defineConfig } from '@yandex-cloud/sls-live-debug';
    import { Handler } from '@yandex-cloud/function-types';

    export default defineConfig({
      handler: <Handler.Http>(event => {
        console.log('got request', event);
        return {
          statusCode: 200,
          body: `Hello from local code!`,
        };
      })
    });
    ```
    <details>
    <summary>Or `live-debug.config.js` (cjs):</summary>

    ```js
    const { defineConfig } = require('@yandex-cloud/sls-live-debug');

    module.exports = defineConfig({
      handler: event => {
        console.log('got request', event);
        return {
          statusCode: 200,
          body: `Hello from local code!`,
        };
      }
    });
    ```

    </details>

4. Run live debug:
    ```
    npx sls-live-debug run
    ```
    Expected output:
    ```
    Using config: live-debug.config.ts
    Running local client...
    Starting child...
    Child started
    Watching changes in: live-debug.config.ts
    WS connection opened
    Local client ready.
    Check url: https://**********.apigw.yandexcloud.net
    Waiting requests...
    GET /?
    Response sent
    ```
    Click provided link and check console.

See [example](/example) for more details.

> Don't forget to add `.live-debug` dir to `.gitignore`

## Usage
All requests to cloud `stub` function will come to local handler.
Inside handler you can setup any routing for your needs.

#### Debug single function
To debug single function you can just assign handler in config:
```ts
import { defineConfig } from '@yandex-cloud/sls-live-debug';
import { handler } from './path/to/your/handler';

export default defineConfig({
  handler
});
```

#### Debug several functions
To debug several functions you can setup routing inside handler (for example by url):
```ts
import { defineConfig } from '@yandex-cloud/sls-live-debug';
import { Handler } from '@yandex-cloud/function-types';
import { handlerA } from './path/to/your/handler-a';
import { handlerB } from './path/to/your/handler-b';

export default defineConfig({
  handler: <Handler.Http>((event, ctx) => {
    // @ts-expect-error url is not typed
    const url = String(event.url);
    if (url.startsWith('/handler-a')) return handlerA(event, ctx);
    if (url.startsWith('/handler-b')) return handlerB(event, ctx);
    return { statusCode: 200, body: 'No handler' };
  })
});
```

#### Debug other triggers
You can debug all other triggers: message queue, object storage, etc.
In cloud console configure needed [trigger](https://cloud.yandex.ru/docs/serverless-containers/concepts/trigger/) to point to `stub` function.
```ts
import { defineConfig } from '@yandex-cloud/sls-live-debug';
import { Handler } from '@yandex-cloud/function-types';

export default defineConfig({
  handler: <Handler.MessageQueue>(event => {
    console.log(event.messages);
  })
});
```

## Watch
By default process watches changes in `live-debug.config.ts` and updates handler.
You can set `watch` key in config to watch additional files and directories:
```ts
import { defineConfig } from '@yandex-cloud/sls-live-debug';

export default defineConfig({
  watch: 'src',
  handler: ...
});
```
