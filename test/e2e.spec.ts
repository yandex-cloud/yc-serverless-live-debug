import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import { LocalClient, runLocalClient } from '../src/local-client';
import { logger } from '../src/helpers/logger';

/** You should run 'npm run example:deploy' before tests */
const outputsFile = 'example/.live-debug/outputs.json';
const configFile = 'test/live-debug.config.ts';

let localClient: LocalClient;

describe('live debug', () => {

  afterEach(async () => {
    await localClient?.close();
  });

  it('successful request', async () => {
    localClient = await runLocalClient({ outputsFile, configFile });

    const response = await sendStubRequest(localClient.httpUrl, '123');
    assert.equal(response, 'Response: 123');

    const response2 = await sendStubRequest(localClient.httpUrl, '456');
    assert.equal(response2, 'Response: 456');
  });

  it('no local clients', async () => {
    localClient = new LocalClient({ outputsFile, configFile });
    const promise = sendStubRequest(localClient.httpUrl, '123');

    await assert.rejects(promise, /No clients connected/);
  });
});

async function sendStubRequest(url: string, body: string) {
  logger.info(`Sending stub request: ${body}`);
  const res = await fetch(url, { method: 'POST', body });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}
