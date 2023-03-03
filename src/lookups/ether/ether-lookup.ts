import LookupBase from '../../base/lookup-base';
import LookupData from '../../models/lookup-data';
import { providers } from 'ethers';
import NotFoundError from '../../models/not-found-error';

const ETH_API_SERVER = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ether_token}`;

class EtherLookup extends LookupBase {
  public async doLookup(name: string): Promise<LookupData> {
    const provider = new providers.StaticJsonRpcProvider(ETH_API_SERVER);
    const resolver = await provider.getResolver(name);
    if (!resolver) {
      throw new NotFoundError('ENS name was not found', 'ENSNotFound', null);
    }

    const [address, phone] = await Promise.all([
      resolver.getAddress(),
      resolver.getText('phone'),
    ]);

    if (!phone) {
      throw new NotFoundError(
        'ENS name did not have a phone number',
        'PhoneNotFound',
        address
      );
    }

    return { name, phone, address };
  }
}

export default EtherLookup;
