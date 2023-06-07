import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import avvy from '@avvy/client';
import { LookupData } from '../../src/models/lookup';
import AvaxLookup from '../../src/avax-lookup';
import { Web3nsNotFoundError } from '../../src/models/web3ns-errors';
import { web3nsConfig } from '../../src/web3ns-providers';

const cfg = web3nsConfig('PRD','XXX'); // Cfg values not actually, just used to satisfy init

vi.mock('@avvy/client');
vi.mock('ethers');

const XCHAIN = 1;
const PCHAIN = 2;
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

const createKvItemFromLookupData = (lookupData: LookupData) => {
  return { name: lookupData.name, address: lookupData.address, phone: lookupData.phone };
};
//#endregion

//#region Mocks
const mockNamespace = (getResponse: LookupData | null = createKvItem()) => {
  const namespace = {
    get: vi.fn().mockResolvedValue(getResponse),
    put: vi.fn().mockResolvedValue(undefined),
  };

  return namespace;
};

/**
 *
 * @param resolverFunction The function to use for resolve: (type: string): string | null => {}, useful for mocking tests with error or expected returns.
 * @returns A reference to the function used for avvy.name, to validate it was/wasn't called.
 */
function mockAvvy(resolverFunction: any) {
  const mockedName = vi.fn().mockImplementation((name: string) => {
    switch (name) {
      case 'not-found.avax':
        return Promise.resolve(null);
      default:
        return Promise.resolve({
          name,
          resolve: resolverFunction,
        });
    }
  });

  avvy.mockImplementation(() => ({
    name: mockedName,
  }));

  return mockedName;
}

const mockAvvyResolverHappyPath = vi.fn().mockImplementation((type: number) => {
  switch (type) {
    case PHONE: // Phone
      return Promise.resolve(defaultPhone);
    case EVM: // Address
      return Promise.resolve(defaultAddress);
    default:
      return Promise.resolve(null);
  }
});
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
      const address = 'test-evm-address';
      mockAvvy(
        vi.fn().mockImplementation((type: number) => {
          switch (type) {
            case EVM:
              return Promise.resolve(address);
            case PHONE:
              return Promise.resolve(defaultPhone);
          }
        })
      );

      const name = 'qwerty.avax';
      const lookupData = await avaxLookup.doLookup(name);

      expect(lookupData.address).toBe(address);
    });

    test('when p_chain defined', () => {
      const address = 'test-p_chain-address';
      mockAvvy(
        vi.fn().mockImplementation((type: number) => {
          switch (type) {
            case PHONE:
              return Promise.resolve(defaultPhone);
            case EVM:
              return Promise.resolve(null);
            case PCHAIN:
              return Promise.resolve(address);
          }
        })
      );
    });

    test('when x_chain defined', async () => {
      const address = 'test-x_chain-address';
      mockAvvy(
        vi.fn().mockImplementation((type: number) => {
          switch (type) {
            case PHONE:
              return Promise.resolve(defaultPhone);
            case XCHAIN:
              return Promise.resolve(address);
            case EVM:
            case PCHAIN:
              return Promise.resolve(null);
          }
        })
      );

      const name = 'qwerty.avax';
      const lookupData = await avaxLookup.doLookup(name);
      expect(lookupData.address).toBe(address);
    });
  });

  test('return valid LookupData', async () => {
    mockAvvy(mockAvvyResolverHappyPath);
    const name = 'qwerty.avax';
    const expected = { name, address: defaultAddress, phone: defaultPhone };

    const lookupData = await avaxLookup.doLookup(name);

    expect(lookupData).toEqual(expected);
  });

  test('throw error when name not found', async () => {
    mockAvvy(mockAvvyResolverHappyPath);
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
    mockedNameFn = mockAvvy(mockAvvyResolverHappyPath);
  });

  test('get lookup from getName', async () => {
    const name = 'qwerty.avax';

    const namespace = {
      get: vi
        .fn()
        .mockImplementation(() => createKvItem(name, testPhone, testAddress)),
      put: vi.fn(),
    } as any;

    const expectedData = createLookupData(name, testPhone, testAddress);

    const lookupData = await avaxLookup.execute(name, namespace);

    expect(lookupData).toEqual(expectedData);
    expect(mockedNameFn).not.toBeCalled();
  });

  test('get lookup from doLookup when name empty', async () => {
    const namespace = mockNamespace(null) as any;

    const name = 'qwerty.avax';
    const expectedData = createLookupData(name);

    const lookupData = await avaxLookup.execute(name, namespace);

    expect(lookupData).toEqual(expectedData);

    expect(mockedNameFn).toHaveBeenCalledTimes(1);
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
