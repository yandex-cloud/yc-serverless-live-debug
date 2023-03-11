/**
 * Local WebSocket client that receives request, runs local code
 * and sends result back to stub function.
 */
import fs from 'node:fs';
import { WsRequest, WsResponse } from '../helpers/ws-protocol';
import { WsClient } from '../helpers/ws-client';
import { logger } from '../helpers/logger';
import { sendToConnection } from '../helpers/ws-apigw-grpc';
import { ChildWrapper } from './child/wrapper';
import { LiveDebugStackOutputs } from './cdktf/main';

export { defineConfig } from './child/process';

export type LocalClientOptions = {
  configFile: string,
  outputsFile: string,
}

export async function runLocalClient(options: LocalClientOptions) {
  const localClient = new LocalClient(options);
  await localClient.run();
  return localClient;
}

export class LocalClient {
  wsClient: WsClient;
  childWrapper: ChildWrapper;
  outputs: LiveDebugStackOutputs;

  constructor(protected options: LocalClientOptions) {
    this.outputs = this.readOutputs();
    this.wsClient = new WsClient(this.wsUrl, {
      'X-Live-Debug-Stub-Id': this.outputs.stubId,
    });
    this.childWrapper = new ChildWrapper(this.options.configFile);
  }

  get wsUrl() {
    return `wss://${this.outputs.apigwHost}/ws/client`;
  }

  get httpUrl() {
    return `https://${this.outputs.apigwHost}`;
  }

  async run() {
    await Promise.all([
      this.wsClient.ensureConnected(),
      this.childWrapper.startChild(),
    ]);
    logger.info('Local client ready.');
    this.waitRequests();
  }

  async close() {
    await Promise.all([
      this.wsClient.close(),
      this.childWrapper.close(),
    ]);
  }

  protected waitRequests() {
    logger.info(`Check url: ${this.httpUrl}`);
    logger.info(`Waiting requests...`);
    this.childWrapper.onResponse = (req: WsRequest, res: WsResponse) => {
      sendToConnection(req.stubConnectionId, res, req.token);
      logger.info('Response sent');
    };
    this.wsClient.onJsonMessage = message => {
      if (message.type !== 'request') {
        throw new Error(`Unknown ws message type: ${message.type}`);
      }
      this.logRequest(message.payload);
      this.childWrapper.handleRequest(message);
    };
  }

  protected logRequest({ event }: WsRequest['payload']) {
    if ('httpMethod' in event) {
      // @ts-expect-error event.url is not typed
      logger.info(`${event.httpMethod} ${event.url}`);
    }
    if ('messages' in event && 'event_metadata' in event.messages[0]) {
      logger.info(`TRIGGER ${event.messages[0]?.event_metadata?.event_type}`);
    }
    // todo: add more triggers
  }

  protected readOutputs() {
    const { outputsFile } = this.options;
    if (!fs.existsSync(outputsFile)) {
      logger.info(`Outputs file not found: ${outputsFile}`);
      logger.info(`Did you run "npx sls-live-debug deploy"?`);
      process.exit();
    }
    const outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
    return outputs['live-debug'];
  }
}
