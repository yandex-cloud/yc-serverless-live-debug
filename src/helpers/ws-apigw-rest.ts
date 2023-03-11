/**
 * Send WS message to connection on API gateway (REST).
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 *
 * NOTE: this file is not used but kept for reference
 */

import fetch from 'node-fetch';
import { logger } from './logger';

const URL_TPL = `https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/{connectionId}/:send`;

export async function sendToConnection1(
  connectionId: string,
  // see: https://stackoverflow.com/questions/66603759/accept-any-object-as-argument-in-function
  // eslint-disable-next-line @typescript-eslint/ban-types
  message: object,
  token: string
) {
  logger.debug(`WS sending message to connection: ${connectionId}`);
  const method = 'POST';
  const url = URL_TPL.replace('{connectionId}', connectionId);
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const body = buildTextBody(message);
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) {
    const { message, code } = await res.json();
    throw new ApigwError(message, code);
  }
  logger.debug(`WS message sent to connection: ${connectionId}`);
}

export class ApigwError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

function buildTextBody(message: object) {
  const messageStr = JSON.stringify(message);
  return JSON.stringify({
    type: 'TEXT',
    data: Buffer.from(messageStr, 'utf8').toString('base64'),
  });
}
