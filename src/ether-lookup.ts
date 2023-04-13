import { providers } from 'ethers';
import LookupBase from './lookup-base';
import LookupData from './models/lookup-data';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const ETH_API_SERVER = 'https://eth-mainnet.alchemyapi.io/v2/';

const PHONE_TEXT = 'phone';

class EtherLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    if (!this.ALCHEMY_API_KEY) {
      throw new Web3nsError('Provider API key was not given', 'InternalEnvError');
    }

    const resolver = await this.getResolver(
      ETH_API_SERVER + this.ALCHEMY_API_KEY,
      name
    );
    if (!resolver) {
      throw new Web3nsNotFoundError('ENS name resolver was not found');
    }

    const [address, phone] = await this.getResolverData(resolver, PHONE_TEXT);

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
