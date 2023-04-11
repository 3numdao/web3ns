import { providers } from 'ethers';
import LookupBase from './lookup-base';
import LookupData from './models/lookup-data';
import NotFoundError from './models/not-found-error';
import RequiredEnvMissing from './models/required-env-missing';

const ETH_API_SERVER = 'https://eth-mainnet.alchemyapi.io/v2/';

const PHONE_TEXT = 'phone';

const ERRORS = Object.freeze({
  REQUIRED_ALCHEMY_API_KEY_ERROR: 'ALCHEMY_API_KEY is a required env var',
  REQUIRED_ALCHEMY_API_KEY_SUGGESTION:
    'Add ALCHEMY_API_KEY as an env var. ' +
    'For local: add ALCHEMY_API_KEY=<your-token> to .dev.var. ' +
    'For hosted worker environment add ALCHEMY_API_KEY to the worker secrets: npx wrangler secret put ALCHEMY_API_KEY',
});

class EtherLookup extends LookupBase {
  constructor(private etherToken: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    if (!this.etherToken) {
      throw new RequiredEnvMissing(
        ERRORS.REQUIRED_ALCHEMY_API_KEY_ERROR,
        'ALCHEMY_API_KEY',
        ERRORS.REQUIRED_ALCHEMY_API_KEY_SUGGESTION
      );
    }

    const resolver = await this.getResolver(
      ETH_API_SERVER + this.etherToken,
      name
    );
    if (!resolver) {
      throw new NotFoundError('ENS name was not found', 'ENSNotFound', null);
    }

    const [address, phone] = await this.getResolverData(resolver, PHONE_TEXT);
    if (!phone) {
      throw new NotFoundError(
        'ENS name did not have a phone number',
        'PhoneNotFound',
        address
      );
    }

    return { name, phone, address };
  }

  private async getResolver(
    apiUrl: string,
    name: string
  ): Promise<providers.Resolver | null> {
    const provider = new providers.StaticJsonRpcProvider({
      url: apiUrl,
      skipFetchSetup: true,
    });

    return provider.getResolver(name);
  }

  private async getResolverData(
    resolver: providers.Resolver,
    text: string
  ): Promise<[string, string]> {
    return Promise.all([resolver.getAddress(), resolver.getText(text)]);
  }
}

export default EtherLookup;
