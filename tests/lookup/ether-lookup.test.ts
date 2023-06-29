import { beforeEach, vi, describe, test, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { Web3nsNotFoundError, Web3nsError } from '../../src/models/web3ns-errors';
import { LookupData, AddressLookupData } from '../../src/models/lookup';
import { web3nsConfig } from '../../src/web3ns-providers';
import EtherLookup from '../../src/ether-lookup';

const cfg = web3nsConfig('PRD','XXX'); // Cfg values not actually, just used to satisfy init

vi.mock('viem', async () => {
  return {
      createPublicClient: vi.fn(),
      http: vi.fn(),
  };
});

const defaultPhone = 'test-phone';
const defaultAddress = 'test-address';

const expectedEtherNotFoundDescription = 'ENS name was not found';

// #region Helper functions
const createKvItem = (
  phone: string = defaultPhone,
  address: string = defaultAddress
): KVItem => {
  return { phone, address };
};

const createLookupData = (
  name: string,
  phone: string = defaultPhone,
  address: string = defaultAddress
): LookupData => {
  return { name, phone, address };
};

const createKvItemFromLookupData = (lookupData: LookupData | AddressLookupData) => {
  return { address: lookupData.address, phone: lookupData.phone };
};
//#endregion

//#region Mocks
const mockNamespace = (getResponse: LookupData | AddressLookupData | null = createKvItem()) => {
  const namespace = {
    get: vi.fn().mockResolvedValue(getResponse),
    put: vi.fn().mockResolvedValue(undefined),
  };

  return namespace;
};

function mockViem(resolverFunction: any) {
  (createPublicClient as any).mockImplementation(() => ({
    getEnsAddress: vi.fn().mockResolvedValue(defaultAddress),
    getEnsText: vi.fn().mockResolvedValue(defaultPhone),
  }));
}
//#endregion

beforeEach(() => {
  vi.clearAllMocks();
});


describe('doLookup should', () => {
  let etherLookup: EtherLookup;

  beforeEach(() => {
    etherLookup = new EtherLookup(cfg);
  });

  test('return valid LookupData', async () => {
    mockViem(
      vi.fn().mockResolvedValue({
        getEnsAddress: vi.fn().mockResolvedValue(defaultAddress),
        getEnsText: vi.fn().mockResolvedValue(defaultPhone),
      })
    );
    const name = 'qwerty.eth';
    const expected = { name, address: defaultAddress, phone: defaultPhone };

    const lookupData = await etherLookup.doLookup(name);

    expect(lookupData).toEqual(expected);
  });

  test('throw error when provider API key was not given', async () => {
    mockViem(vi.fn());
    etherLookup = new EtherLookup('');
    const name = 'qwerty.eth';

    return etherLookup
      .doLookup(name)
      .then(() => expect.fail)
      .catch((e: Web3nsError) => {
        expect(e).toBeInstanceOf(Web3nsError);
        expect(e.httpStatus).toBe(404);
        expect(e.message).toBe('ENS name resolver was not found');
      });
  });

  test('throw error when name not found', async () => {
    mockViem(vi.fn().mockImplementation(() => null));
    const name = 'not-found.eth';

    return etherLookup
      .doLookup(name)
      .then(() => expect.fail)
      .catch((e: Web3nsNotFoundError) => {
        expect(e).toBeInstanceOf(Web3nsError);
        expect(e.httpStatus).toBe(404);
        expect(e.message).toBe('ENS name resolver was not found');
      });
  });
});
