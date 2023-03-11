/**
 * WebSocket client wrapper.
 */
import http from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { WsMessage } from './ws-protocol';
import { logger } from './logger';

type WaitFn = (message: WsMessage) => unknown;
type WaitFnData = {
  resolve: (v: WsMessage) => unknown,
  reject: (e: Error) => unknown,
};

export class WsClient {
  ws!: WebSocket;
  connectionId = '';
  onJsonMessage?: (message: WsMessage) => unknown;

  protected waitFns = new Map<WaitFn, WaitFnData>();

  constructor(
    public wsUrl: string,
    protected headers: Record<string, string> = {}
  ) {}

  async ensureConnected() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info(`WS connection already open`);
      return;
    }
    await new Promise(resolve => {
      this.ws = new WebSocket(this.wsUrl, { headers: this.headers });
      this.ws.on('open', resolve);
      this.ws.on('upgrade', req => this.onUpgrade(req));
      this.ws.on('message', message => this.onMessage(message));
      this.ws.on('close', (code, reason) => this.onClose(code, reason));
      // todo: connection error
      // todo: timeout
    });
    logger.info(`WS connection opened`);
  }

  async sendJson(message: WsMessage) {
    const strMessage = JSON.stringify(message);
    logger.debug(`WS ->: ${strMessage}`);
    this.ws?.send(strMessage);
  }

  clearListeners() {
    this.waitFns.clear();
  }

  async waitMessage(fn: WaitFn) {
    // todo: timeout
    return new Promise<WsMessage>((resolve, reject) => {
      this.waitFns.set(fn, { resolve, reject });
    });
  }

  async close() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
      await once(this.ws, 'close');
    }
  }

  protected onMessage(message: WebSocket.RawData) {
    logger.debug(`WS <-: ${message}`);
    const jsonMessage = JSON.parse(message.toString()) as WsMessage;
    this.waitFns.forEach(({ resolve }, fn) => {
      if (fn(jsonMessage)) resolve(jsonMessage);
    });
    this.onJsonMessage?.(jsonMessage);
  }

  protected onUpgrade(req: http.IncomingMessage) {
    this.connectionId = <string>req.headers['x-yc-apigateway-websocket-connection-id'];
  }

  protected onClose(code: number, reason: Buffer) {
    logger.info(`WS connection closed: ${code} ${reason}`);
    // todo: remove listeners
  }
}
