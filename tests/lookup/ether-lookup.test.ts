import { beforeEach, vi, describe, test, expect } from 'vitest';
import { providers } from 'ethers';
import { Web3nsNotFoundError, Web3nsError } from '../../src/models/web3ns-errors';
import { LookupData, AddressLookupData } from '../../src/models/lookup';
import EtherLookup from '../../src/ether-lookup';

vi.mock('ethers', async () => {
  return {
    providers: {
      StaticJsonRpcProvider: vi.fn(),
    },
  };
});

const defaultPhone = 'test-phone';
const defaultAddress = 'test-address';
const defaultToken = 'test-token';

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

function mockEthers(resolverFunction: any) {
  (providers.StaticJsonRpcProvider as any).mockImplementation(() => ({
    getResolver: resolverFunction,
  }));
}
//#endregion

beforeEach(() => {
  vi.clearAllMocks();
});


describe('doLookup should', () => {
  let etherLookup: EtherLookup;

  beforeEach(() => {
    etherLookup = new EtherLookup(defaultToken);
  });

  test('return valid LookupData', async () => {
    mockEthers(
      vi.fn().mockResolvedValue({
        getAddress: vi.fn().mockResolvedValue(defaultAddress),
        getText: vi.fn().mockResolvedValue(defaultPhone),
      })
    );
    const name = 'qwerty.eth';
    const expected = { name, address: defaultAddress, phone: defaultPhone };

    const lookupData = await etherLookup.doLookup(name);

    expect(lookupData).toEqual(expected);
  });

  test('throw error when provider API key was not given', async () => {
    mockEthers(vi.fn());
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
    mockEthers(vi.fn().mockImplementation(() => null));
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
