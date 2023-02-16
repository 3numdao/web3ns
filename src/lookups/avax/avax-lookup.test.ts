import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import KVItem from '../../models/kv-item';
import LookupData from '../../models/lookup-data';
import AvaxLookup from '../avax/avax-lookup';
import avvy from '@avvy/client';
import NotFoundError from '../../models/not-found-error';

vi.mock('@avvy/client');
vi.mock('ethers');

const XCHAIN = 1;
const PCHAIN = 2;
const EVM = 3;
const PHONE = 9;

const defaultPhone = 'test-phone';
const defaultAddress = 'test-address';

const expectedPhoneNotFoundCode = 'PhoneNotFound';
const expectedPhoneNotFoundDescription =
  'Avvy name did not have a phone number';
const expectedAvvyNotFoundDescription = 'Avvy name was not found';
const expectedAvvyNotFoundCode = 'AvvyNotFound';

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

describe('getName should', () => {
  let namespace: KVNamespace;
  let avaxLookup: AvaxLookup;

  beforeEach(() => {
    namespace = mockNamespace() as any;
    avaxLookup = new AvaxLookup();
  });

  test('call get on namespace with given params', async () => {
    const name = 'qwerty';
    await avaxLookup.getName(name, namespace);

    expect(namespace.get).toHaveBeenCalledWith(name, { type: 'json' });
  });
});

describe('saveName should', () => {
  let namespace: KVNamespace;
  let avaxLookup: AvaxLookup;

  beforeEach(() => {
    namespace = mockNamespace() as any;
    avaxLookup = new AvaxLookup();
  });

  test('call put on the given namespace with params', async () => {
    const name = 'qwerty.avax';
    const lookupData = createLookupData(name);
    const minutes = Math.floor(Math.random() * 10);

    const expectedKvItem = JSON.stringify(
      createKvItemFromLookupData(lookupData)
    );

    await avaxLookup.saveName(lookupData, namespace, minutes);

    expect(namespace.put).toHaveBeenCalledWith(name, expectedKvItem, {
      expirationTtl: minutes * 60,
    });
  });
});

describe('doLookup should', () => {
  let avaxLookup: AvaxLookup;

  beforeEach(() => {
    avaxLookup = new AvaxLookup();
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
      .catch((e: NotFoundError) => {
        expect(e).toBeInstanceOf(NotFoundError);
        expect(e.address).toBe(null);
        expect(e.code).toBe(404);
        expect(e.name).toBe(expectedAvvyNotFoundCode);
        expect(e.message).toBe(expectedAvvyNotFoundDescription);
      });
  });

  test('throw error when phone not found', () => {
    mockAvvy(mockAvvyResolverHappyPath);
    const name = 'qwerty.avax';

    return avaxLookup
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

describe('execute should', () => {
  let avaxLookup: AvaxLookup;
  let mockedNameFn: any;
  const testPhone = 'test-phone-not-default';
  const testAddress = 'test-address-not-default';

  beforeEach(() => {
    avaxLookup = new AvaxLookup();
    mockedNameFn = mockAvvy(mockAvvyResolverHappyPath);
  });

  test('get lookup from getName', async () => {
    const namespace = {
      get: vi
        .fn()
        .mockImplementation(() => createKvItem(testPhone, testAddress)),
      put: vi.fn(),
    } as any;

    const name = 'qwerty.avax';
    const expectedData = createLookupData(name, testPhone, testAddress);

    const lookupData = await avaxLookup.execute(name, namespace);

    expect(lookupData).toEqual(expectedData);
    expect(mockedNameFn).not.toBeCalled();
  });

  test('get lookup from doLookup when name empty', async () => {
    const expectedKVItem = { address: 'test-address', phone: 'test-phone' };
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
      JSON.stringify(expectedKVItem),
      { expirationTtl: 5 * 60 }
    );
  });
});
