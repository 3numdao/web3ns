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

  it('should return address for boscolo.cb.id', async () => {
    const resp = await worker.fetch('/api/v1/lookup/boscolo.cb.id');

    if (resp) {
       const response = await resp.json();
      expect(response).toEqual({
        name: 'boscolo.cb.id',
        address: '0xa1FAa890DD55a71b329Df3f2B8Be00cB2f6459DB',
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
        const response = await resp.json();
        expect(response).toEqual({
            name: 'boscolo',
            address: '0x3eFbe95EBdE6042147644Bc39CdfcF54B8E4f523',
            phone: '',
        });
    }
  });

  it('should return address for +18059024256', async () => {
    const resp = await worker.fetch('/api/v1/lookup/+18059024256');

    if (resp) {
        const response = await resp.json();
        expect(response).toEqual({
            name: '+18059024256',
            address: '0x6697d7cd36eD1782dFdb721d3c3a1f4F901b957d',
            phone: '',
        });
    }
  });

  it('should return "boscolo.eth" for address 0x6a40260B27B13E52033c211b840f04DC64059748', async () => {
    const resp = await worker.fetch('/api/v1/address/0x6a40260B27B13E52033c211b840f04DC64059748');

    if (resp) {
        const response = await resp.json();
        expect(response).toEqual({
            eth: { name: 'boscolo.eth' },
            avax: { name: '' },
            farcaster: { name: '', fid: '' },
        });
    }
  });

  it('should return Farcaster name/d for address 0x3eFbe95EBdE6042147644Bc39CdfcF54B8E4f523', async () => {
    const resp = await worker.fetch('/api/v1/address/0x3eFbe95EBdE6042147644Bc39CdfcF54B8E4f523');

    if (resp) {
        const response = await resp.json();
        expect(response).toEqual({
            eth: { name: '' },
            avax: { name: '' },
            farcaster: { name: '', fid: '1898' },
        });
    }
  });

});
