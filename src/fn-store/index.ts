/**
 * Store function saves client connection info in YDB.
 */
import { logger } from '../helpers/logger';
import { Handler } from '@yandex-cloud/function-types';
import { Ydb } from '../helpers/ydb';
import { CloudRequest } from '../helpers/cloud-request';

export const handler: Handler.ApiGateway.WebSocket.Connect = async (event, context) => {
  const req = new CloudRequest(event, context);
  if (req.isWebSocketRequest() && req.wsEventType === 'CONNECT') {
    return saveClientConnectionInfo(req);
  } else {
    return req.buildErrorResponse(new Error('Unsupported request'));
  }
};

async function saveClientConnectionInfo(req: CloudRequest) {
  try {
    const stubId = req.headers['X-Live-Debug-Stub-Id'];
    const gatewayId = req.headers['X-Serverless-Gateway-Id'];
    logger.info(`client connect: stubId=${stubId}, connId=${req.wsConnectionId}`);
    await new Ydb(req.token).saveConnection(stubId, req.wsConnectionId, gatewayId);
    return req.buildSuccessResponse();
  } catch (e) {
    logger.error(e);
    return req.buildErrorResponse(e);
  }
}
