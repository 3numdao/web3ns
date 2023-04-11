import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

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

  it('should return valid record for 3numdao.avax', async () => {
    const resp = await worker.fetch('/api/v1/lookup/3numdao.avax');
    if (resp) {
      const response = await resp.json();
      expect(response).toEqual({
        address: '0xa18a6AAa73f03F43E8E29Fde02010735b5852b4c',
        name: '3numdao.avax',
        phone: '14254416889',
      });
    }
  });
});
