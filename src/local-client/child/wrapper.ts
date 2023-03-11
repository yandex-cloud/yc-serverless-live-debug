/**
 * Runs child process and re-run on files change
 */
import { ChildProcess, fork } from 'node:child_process';
import chokidar, { FSWatcher } from 'chokidar';
import { once } from 'node:events';
import { WsRequest, WsResponse } from '../../helpers/ws-protocol';
import { ChildInit, ChildResponse } from './process';
import { logger } from '../../helpers/logger';

export class ChildWrapper {
  child?: ChildProcess;
  watcher?: FSWatcher;
  onResponse?: (req: WsRequest, res: WsResponse) => unknown;

  private reqQueue: WsRequest[] = [];

  constructor(private configFile: string) {}

  async startChild() {
    logger.info(`${this.child ? 'Restarting' : 'Starting'} child...`);

    this.killChild().catch(e => logger.error(e));

    const isTS = this.configFile.endsWith('.ts');
    // todo: check somehow that ts-node is installed, and suggest to install
    // instead of having it in dependencies
    const execArgv = isTS ? ['-r', 'ts-node/register/transpile-only'] : [];
    const child = fork(this.configFile, [], {
      execArgv,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });
    child.on('message', (message: ChildInit | ChildResponse) => {
      this.handleChildMessage(message);
    });
    await once(child, 'spawn');
    this.child = child;
    logger.info('Child started');

    this.flushReqQueue();
  }

  async handleRequest(req: WsRequest) {
    if (this.child) {
      this.child.send(req);
    } else {
      this.reqQueue.push(req);
    }
  }

  async close() {
    await Promise.all([
      this.killChild(),
      this.watcher?.close(),
    ]);
  }

  protected async killChild() {
    if (this.child) {
      const child = this.child;
      this.child = undefined;
      child.kill();
      await once(child, 'close');
      logger.debug('child killed');
    }
  }

  protected async initWatcher(watchPath: string | string[] = []) {
    // check if watchPath changed
    if (this.watcher) return;
    const paths = Array.isArray(watchPath) ? watchPath : [watchPath];
    paths.push(this.configFile);
    this.watcher = chokidar.watch(paths, { ignoreInitial: true });
    this.watcher.on('all', async (event, path) => {
      logger.info(event, path);
      await this.startChild();
    });
    await once(this.watcher, 'ready');
    logger.info(`Watching changes in: ${paths.join(', ')}`);
  }

  protected handleChildMessage(message: ChildInit | ChildResponse) {
    if (message.type === 'init') {
      this.initWatcher(message.watch);
    } else if (message.type === 'response') {
      this.onResponse?.(message.req, message.res);
    }
  }

  protected flushReqQueue() {
    this.reqQueue.forEach(req => this.child?.send(req));
    this.reqQueue.length = 0;
  }
}
