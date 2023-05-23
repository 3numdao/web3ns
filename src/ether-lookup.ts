import { createPublicClient, http } from 'viem'
import { web3nsConfig } from './web3ns-providers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const PHONE_TEXT = 'phone';

class EtherLookup extends LookupBase {
  constructor(private cfg: web3nsConfig) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    console.log('eth doLookup name: ', name, this.cfg.ethApi);
    const client = createPublicClient({
      chain: this.cfg.ethChain,
      transport: http(this.cfg.ethApi)
    })

    try {
      let [address, phone] = await Promise.all([client.getEnsAddress({name: name}), client.getEnsText({name: name, key: PHONE_TEXT})]);

      address = address || '';
      phone = phone || '';

      return { name, phone, address };
    } catch (error: any) {
      const msg = error.message || '';
      throw new Web3nsError(`Ethereum name lookup failed: ${msg}`, 'InternalError');
    }
  }
}

export default EtherLookup;
