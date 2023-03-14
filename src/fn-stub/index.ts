/**
 * Stub function proxies HTTP requests to local code via WebSocket.
 */
import { WsRequest } from '../helpers/ws-protocol';
import { WsClient } from '../helpers/ws-client';
import { logger } from '../helpers/logger';
import { Handler } from '@yandex-cloud/function-types';
import { Ydb } from '../helpers/ydb';
import { ApigwError, sendToConnection } from '../helpers/ws-apigw-grpc';
import { CloudRequest } from '../helpers/cloud-request';

// reuse ws connection between calls
let wsClient: WsClient;

export const handler: Handler.Http = async (event, context) => {
  const req = new CloudRequest(event, context);
  try {
    const localClientInfo = await getLocalClientInfo(req);
    await connectToWs(localClientInfo.gatewayId);
    await sendToLocalClient(localClientInfo.connectionId, req);
    const response = await waitResponse(req);
    return response.payload;
  } catch (e) {
    logger.error(e.stack);
    return req.buildErrorResponse(e);
  } finally {
    wsClient?.clearListeners();
  }
};

async function getLocalClientInfo(req: CloudRequest) {
  const stubId = getStubId(req);
  const connection = await new Ydb(req.token).getConnection(stubId);
  if (!connection) throw new Error(`No client connections for stub: ${stubId}`);
  const { connectionId, gatewayId } = connection;
  logger.info(`Client connection found: ${connectionId}`);
  return { connectionId, gatewayId };
}

async function sendToLocalClient(clientConnectionId: string, req: CloudRequest) {
  logger.info(`Sending request to local client...`);
  const message: WsRequest = {
    type: 'request',
    reqId: req.id,
    stubConnectionId: wsClient.connectionId,
    token: req.token,
    payload: {
      event: req.event,
      context: req.context,
    },
  };
  try {
    await sendToConnection(clientConnectionId, message, req.token);
  } catch (e) {
    // todo: check e.code?
    if (e instanceof ApigwError) {
      throw new Error(`No clients connected for stub: ${getStubId(req)}`);
    } else {
      throw e;
    }
  }
  return message;
}

async function waitResponse(req: CloudRequest) {
  logger.info(`Waiting response...`);
  const message = await wsClient.waitMessage(m => m.reqId === req.id);
  logger.info(`Got response: ${JSON.stringify(message)}`);
  if (message.type === 'response') return message;
  throw new Error(`Invalid response type: ${message.type}`);
}

async function connectToWs(gatewayId: string) {
  const stubWsUrl = getStubWsUrl(gatewayId);
  if (wsClient?.wsUrl !== stubWsUrl) {
    wsClient = new WsClient(stubWsUrl);
  }
  await wsClient.ensureConnected();
}

function getStubWsUrl(gatewayId: string) {
  return `wss://${gatewayId}.apigw.yandexcloud.net/ws/stub`;
}

function getStubId(req: CloudRequest) {
  return req.functionId;
}
