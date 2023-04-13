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

  it('should return valid record for 3num.eth', async () => {
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

  it('should return address for brianfive.lens', async () => {
    const resp = await worker.fetch('/api/v1/lookup/brianfive.lens');

    if (resp) {
       const response = await resp.json();
      expect(response).toEqual({
        name: 'brianfive.lens',
        address: '0x08f9edd4Feb42eFc388818e68dd525E87462fDb1',
        phone: '',
      });
    }
  });

  it('should return 404 not found for foobarzyssaae3249.lens', async () => {
    const resp = await worker.fetch('/api/v1/lookup/foobarzyssaae3249.lens');

    if (resp) {
      const response = await resp.json();

      expect(resp.status).toEqual(404);
      expect(response).toEqual({
        error: "NotFoundError",
        message: "Lens name was not found"
      });
    }
  });

  it('should return farcaster address for boscolo', async () => {
    const resp = await worker.fetch('/api/v1/lookup/boscolo');

    if (resp) {
//        console.log('resp ', resp);

//        expect(1).toEqual(1);

        const response = await resp.json();
        expect(response).toEqual({
            name: 'boscolo',
            address: '0x3eFbe95EBdE6042147644Bc39CdfcF54B8E4f523',
            phone: '',
        });
    }
  });


});
