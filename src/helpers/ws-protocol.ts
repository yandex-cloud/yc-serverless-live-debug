/**
 * Protocol messages.
 */
import { CloudEvent, CloudContext, CloudHandler } from './cloud-request';

export type WsMessage = WsRequest | WsResponse;

export interface WsRequest {
  type: 'request',
  reqId: string,
  stubConnectionId: string,
  token: string,
  payload: {
    event: CloudEvent,
    context: CloudContext,
  },
}

export interface WsResponse {
  type: 'response',
  reqId: string,
  payload: ReturnType<CloudHandler>,
}
