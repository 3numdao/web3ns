import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { LookupData } from '../../src/models/lookup';
import AvaxLookup from '../../src/avax-lookup';
import { Web3nsNotFoundError } from '../../src/models/web3ns-errors';
import { web3nsConfig } from '../../src/web3ns-providers';

const cfg = web3nsConfig('PRD','XXX'); // Cfg values not actually, just used to satisfy init

const EVM = 3;
const PHONE = 9;

const defaultPhone = 'test-phone';
const defaultAddress = 'test-address';

const expectedAvvyNotFoundDescription = 'Avvy name was not found';

// #region Helper functions
const createKvItem = (
  name: string,
  phone: string = defaultPhone,
  address: string = defaultAddress
): LookupData => {
  return { name, phone, address };
};

const createLookupData = (
  name: string,
  phone: string = defaultPhone,
  address: string = defaultAddress
): LookupData => {
  return { name, phone, address };
};

vi.mock('viem', async () => {
  return {
      createPublicClient: vi.fn(() => ({
        readContract: vi.fn((arg) => {
          if (arg.args[1] === EVM) {
            return defaultAddress;
            //vi.fn().mockResolvedValue(defaultAddress)
          } else if (arg.args[1] === PHONE) {
            return defaultPhone;
            //vi.fn().mockResolvedValue(defaultPhone)
          }
        })
      })),
      http: vi.fn(),
      parseAbi: vi.fn(),
  };
});

//#endregion

//#region Mocks
const mockNamespace = (getResponse: LookupData | null = createKvItem()) => {
  const namespace = {
    get: vi.fn().mockResolvedValue(getResponse),
    put: vi.fn().mockResolvedValue(undefined),
  };

  return namespace;
};
//#endregion

beforeEach(() => {
  vi.clearAllMocks();
});

describe('doLookup should', () => {
  let avaxLookup: AvaxLookup;

  beforeEach(() => {
    avaxLookup = new AvaxLookup(cfg);
  });

  describe('assign address', () => {
    test('when evm defined', async () => {
      const address = 'test-address';

      const name = 'qwerty.avax';
      const lookupData = await avaxLookup.doLookup(name);

      expect(lookupData.address).toBe(address);
    });
  });

  test('return valid LookupData', async () => {
    const name = 'qwerty.avax';
    const expected = { name, address: defaultAddress, phone: defaultPhone };

    const lookupData = await avaxLookup.doLookup(name);

    expect(lookupData).toEqual(expected);
  });

  test('throw error when name not found', async () => {
    const name = 'not-found.avax';

    return avaxLookup
      .doLookup(name)
      .then(() => expect.fail)
      .catch((e: Web3nsNotFoundError) => {
        expect(e).toBeInstanceOf(Web3nsNotFoundError);
        expect(e.httpStatus).toBe(404);
        expect(e.message).toBe(expectedAvvyNotFoundDescription);
      });
  });
});

describe('execute should', () => {
  let avaxLookup: AvaxLookup;
  let mockedNameFn: any;
  const testPhone = 'test-phone-not-default';
  const testAddress = 'test-address-not-default';

  beforeEach(() => {
    avaxLookup = new AvaxLookup(cfg);
  });

  test('get lookup from getName', async () => {
    const name = 'qwerty.avax';

    const namespace = {
      get: vi.fn().mockImplementation(() => createKvItem(name, testPhone, testAddress)),
      put: vi.fn(),
    } as any;

    const expectedData = createLookupData(name, testPhone, testAddress);

    const lookupData = await avaxLookup.execute(name, namespace);

    expect(lookupData).toEqual(expectedData);
  });

  test('get lookup from doLookup when name empty', async () => {
    const namespace = mockNamespace(null) as any;

    const name = 'qwerty.avax';
    const expectedData = createLookupData(name);

    const lookupData = await avaxLookup.execute(name, namespace);

    expect(lookupData).toEqual(expectedData);

    expect(namespace.get).toHaveBeenCalledWith(name, {
      type: 'json',
    });
    expect(namespace.put).toHaveBeenCalledWith(
      name,
      JSON.stringify({ name: 'qwerty.avax', phone: 'test-phone', address: 'test-address'}),
      { expirationTtl: 5 * 60 }
    );
  });
});
