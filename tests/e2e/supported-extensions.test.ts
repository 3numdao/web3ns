import { beforeAll, describe, expect, it } from 'vitest';
import { UnstableDevWorker, unstable_dev } from 'wrangler';

describe('supported-extension should', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  it('return supported extensions', async () => {
    const resp = await worker.fetch('/api/v1/extensions');

    if (resp) {
      const response = await resp.json();
      expect(response).toEqual(['.eth', '.avax', '.lens', 'cb.id']);
    }
  });
});
