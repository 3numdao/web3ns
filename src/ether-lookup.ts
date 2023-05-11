import { createPublicClient, http } from 'viem'
import { mainnet, goerli } from 'viem/chains'
import {ALCHEMY_ETH_MAINNET_URL } from './web3ns-providers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const PHONE_TEXT = 'phone';

class EtherLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
        
    const client = createPublicClient({
      chain: mainnet,
      transport: http(ALCHEMY_ETH_MAINNET_URL + this.ALCHEMY_API_KEY)
    })

    let [address, phone] = await Promise.all([client.getEnsAddress({name: name}), client.getEnsText({name: name, key: PHONE_TEXT})]);

    address = address || '';
    phone = phone || '';

    return { name, phone, address };
  }
}

export default EtherLookup;
