import { providers } from 'ethers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const PHONE_TEXT = 'phone';

class EtherLookup extends LookupBase {
  constructor(private ALCHEMY_API_URL: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    
    const resolver = await this.getResolver(this.ALCHEMY_API_URL, name);

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
