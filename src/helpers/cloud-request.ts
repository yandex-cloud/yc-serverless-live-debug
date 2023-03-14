/**
 * Cloud function request wrapper.
 */
import { Handler } from '@yandex-cloud/function-types';

export type CloudHandler =
  | Handler.ApiGateway.Authorizer
  | Handler.ApiGateway.WebSocket.Connect
  | Handler.ApiGateway.WebSocket.Message
  | Handler.ApiGateway.WebSocket.Disconnect
  | Handler.Budget
  | Handler.CloudLogging
  | Handler.ContainerRegistry
  | Handler.DataStreams
  | Handler.Http
  | Handler.IotCore
  | Handler.MessageQueue
  | Handler.ObjectStorage
  | Handler.Timer;

export type CloudEvent = Parameters<CloudHandler>[ 0 ];
export type CloudContext = Parameters<CloudHandler>[ 1 ];

export class CloudRequest {
  private decodedBody?: string;

  constructor(public event: CloudEvent, public context: CloudContext) { }

  get id() {
    return this.context.requestId || '';
  }

  get token() {
    return this.context.token?.access_token || '';
  }

  get functionId() {
    return this.context.functionName;
  }

  get headers() {
    if ('headers' in this.event) {
      return this.event.headers;
    }
    return {};
  }

  get wsConnectionId() {
    if ('requestContext' in this.event) {
      if ('connectionId' in this.event.requestContext) {
        return this.event.requestContext.connectionId;
      }
    }
    return '';
  }

  get wsEventType() {
    if ('requestContext' in this.event) {
      if ('eventType' in this.event.requestContext) {
        return this.event.requestContext.eventType;
      }
    }
    return '';
  }

  get body() {
    if ('body' in this.event && this.decodedBody === undefined) {
      const { body, isBase64Encoded } = this.event;
      this.decodedBody = isBase64Encoded
        ? Buffer.from(body, 'base64').toString('utf8')
        : body;
    }

    return this.decodedBody;
  }

  isWebSocketRequest() {
    return Boolean(this.wsConnectionId);
  }

  buildSuccessResponse(body?: unknown) {
    const strBody = body === undefined
      ? undefined
      : (typeof body === 'object' ? JSON.stringify(body) : String(body));
    // todo: content type
    return {
      statusCode: 200,
      body: strBody,
    };
  }

  buildErrorResponse(e: Error, statusCode = 500) {
    const body = `${e.stack}\nEVENT: ${JSON.stringify(this.event)}`;
    return {
      statusCode,
      body,
    };
  }
}
