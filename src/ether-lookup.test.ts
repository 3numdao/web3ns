import { beforeEach, vi, describe, test, expect } from 'vitest';
import { providers } from 'ethers';
import KVItem from './models/kv-item';
import LookupData from './models/lookup-data';
import EtherLookup from './ether-lookup';
import NotFoundError from './models/not-found-error';
import RequiredEnvMissing from './models/required-env-missing';

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

const expectedPhoneNotFoundCode = 'PhoneNotFound';
const expectedPhoneNotFoundDescription = 'ENS name did not have a phone number';
const expectedEtherNotFoundDescription = 'ENS name was not found';
const expectedEtherNotFoundCode = 'ENSNotFound';
const expectedEtherTokenErrorMessage = 'ALCHEMY_API_KEY is a required env var';
const expectedRequiredEtherToken =
  'Add ALCHEMY_API_KEY as an env var. ' +
  'For local: add ALCHEMY_API_KEY=<your-token> to .dev.var. ' +
  'For hosted worker environment add ALCHEMY_API_KEY to the worker secrets: npx wrangler secret put ALCHEMY_API_KEY';

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
      .catch((e: RequiredEnvMissing) => {
        expect(e).toBeInstanceOf(RequiredEnvMissing);
        expect(e.code).toBe(500);
        expect(e.key).toBe('ALCHEMY_API_KEY');
        expect(e.suggestion).toBe(expectedRequiredEtherToken);
        expect(e.message).toBe(expectedEtherTokenErrorMessage);
      });
  });

  test('throw error when name not found', async () => {
    mockEthers(vi.fn().mockImplementation(() => null));
    const name = 'not-found.eth';

    return etherLookup
      .doLookup(name)
      .then(() => expect.fail)
      .catch((e: NotFoundError) => {
        expect(e).toBeInstanceOf(NotFoundError);
        expect(e.address).toBe(null);
        expect(e.code).toBe(404);
        expect(e.name).toBe(expectedEtherNotFoundCode);
        expect(e.message).toBe(expectedEtherNotFoundDescription);
      });
  });

  test('throw error when phone not found', async () => {
    mockEthers(
      vi.fn().mockImplementation(() => ({
        getAddress: vi.fn().mockResolvedValue(defaultAddress),
        getText: vi.fn().mockResolvedValue(null),
      }))
    );
    const name = 'qwerty.avax';

    return etherLookup
      .doLookup(name)
      .then(() => expect.fail)
      .catch((e: NotFoundError) => {
        expect(e).toBeInstanceOf(NotFoundError);
        expect(e.address).toBe(defaultAddress);
        expect(e.code).toBe(404);
        expect(e.name).toBe(expectedPhoneNotFoundCode);
        expect(e.message).toBe(expectedPhoneNotFoundDescription);
      });
  });
});
