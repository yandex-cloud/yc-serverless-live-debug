/**
 * Send WS message to connection on API gateway (GRPC).
 * See: https://github.com/yandex-cloud-examples/yc-serverless-serverless-game/blob/master/src/server/utils/ws.ts
 */

import { cloudApi, serviceClients, Session } from '@yandex-cloud/nodejs-sdk';
import { logger } from './logger';

const { serverless: { apigateway_connection_service: connectionService } } = cloudApi;

let cloudApiSession: Session;

export async function sendToConnection(
  connectionId: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  message: object,
  iamToken: string
) {
  logger.debug(`WS sending message to connection: ${connectionId}`);
  cloudApiSession = cloudApiSession || new Session({ iamToken });
  const wsClient = cloudApiSession.client(serviceClients.WebSocketConnectionServiceClient);
  const messageStr = JSON.stringify(message);
  const request = connectionService.SendToConnectionRequest.fromPartial({
    connectionId,
    // todo: use BINARY
    type: connectionService.SendToConnectionRequest_DataType.TEXT,
    // @ts-expect-error data should accept string
    data: Buffer.from(messageStr, 'utf8').toString('base64'),
  });

  try {
    await wsClient.send(request);
    logger.debug(`WS message sent to connection: ${connectionId}`);
  } catch(e) {
    throw new ApigwError(e.message, 0);
  }
}

export class ApigwError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

