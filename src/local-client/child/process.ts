/**
 * Code running inside child process.
 */
import { CloudHandler } from '../../helpers/cloud-request';
import { logger } from '../../helpers/logger';
import { WsRequest, WsResponse } from '../../helpers/ws-protocol';

export interface LiveDebugConfig {
  watch?: string | string[],
  handler: CloudHandler,
}

export interface ChildInit {
  type: 'init';
  watch?: LiveDebugConfig['watch'];
}

export interface ChildResponse {
  type: 'response',
  req: WsRequest,
  res: WsResponse,
}

export function defineConfig({ handler, watch }: LiveDebugConfig) {
  process.on('message', (req: WsRequest) => handleRequest(handler, req));
  sendToParent({ type: 'init', watch });
}

async function handleRequest(handler: CloudHandler, req: WsRequest) {
  const payload = await runHandler(handler, req);
  const res: WsResponse = {
    type: 'response',
    reqId: req.reqId,
    payload,
  };
  sendToParent({ type: 'response', req, res });
}

async function runHandler(handler: CloudHandler, req: WsRequest) {
  try {
    const { event, context } = req.payload;
    // @ts-expect-error dont know how to fix this
    return await handler(event, context) as WsResponse['payload'];
  } catch (e) {
    logger.error(e);
    return {
      statusCode: 500,
      body: e.stack,
    };
  }
}

function sendToParent(message: ChildInit | ChildResponse) {
  process.send?.(message);
}
