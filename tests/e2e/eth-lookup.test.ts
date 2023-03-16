import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { UnstableDevWorker, unstable_dev } from 'wrangler';

describe('Worker', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should return Hello World', async () => {
    const resp = await worker.fetch('/api/v1/lookup/3num.eth');
    if (resp) {
      const response = await resp.json();
      expect(response).toEqual({
        name: '3num.eth',
        address: '0x1A67819cE0d5Fd493417F98c333BC7f54c09fD80',
        phone: '+14254416889',
      });
    }
  });
});
