import { beforeEach, vi, describe, test, expect } from 'vitest';
import { providers } from 'ethers';
import KVItem from './models/kv-item';
import { LookupData } from './models/lookup';
import EtherLookup from './ether-lookup';
import { Web3nsNotFoundError, Web3nsError } from './models/web3ns-errors';

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

const createKvItemFromLookupData = (lookupData: LookupData) => {
  return { address: lookupData.address, phone: lookupData.phone };
};
//#endregion

//#region Mocks
const mockNamespace = (getResponse: KVItem | null = createKvItem()) => {
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

describe('getName should', () => {
  let namespace: KVNamespace;
  let etherLookup: EtherLookup;

  beforeEach(() => {
    namespace = mockNamespace() as any;
    etherLookup = new EtherLookup(defaultToken);
  });

  test('call get on namespace with given params', async () => {
    const name = 'qwerty';
    await etherLookup.getName(name, namespace);
    await expect(namespace.get).toHaveBeenCalledWith(name, { type: 'json' });
  });
});

describe('saveName should', () => {
  let namespace: KVNamespace;
  let etherLookup: EtherLookup;

  beforeEach(() => {
    namespace = mockNamespace() as any;
    etherLookup = new EtherLookup(defaultToken);
  });

  test('call put on the given namespace with params', async () => {
    const name = 'qwerty.avax';
    const lookupData = createLookupData(name);
    const minutes = Math.floor(Math.random() * 10);

    const expectedKvItem = JSON.stringify(
      createKvItemFromLookupData(lookupData)
    );

    await etherLookup.saveName(lookupData, namespace, minutes);

    expect(namespace.put).toHaveBeenCalledWith(name, expectedKvItem, {
      expirationTtl: minutes * 60,
    });
  });
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
