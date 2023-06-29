import { createPublicClient, http, parseAbi } from 'viem';

import { LookupData, LookupBase } from './models/lookup';
import { Web3nsNotFoundError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';

const AVVY_EVM = 0x3
const AVVY_PHONE = 0x9

class AvaxLookup extends LookupBase {
  private client;

  constructor(private cfg: web3nsConfig) {
    super();

    this.client = createPublicClient({
      chain: cfg.avaxChain,
      transport: http(cfg.avaxApi)
    });

  }

  public async doLookup(name: string): Promise<LookupData> {

    let address;
    try {
      address = await this.avvyGetByKey(name, AVVY_EVM);
    } catch (e) {
      throw new Web3nsNotFoundError('Avvy name was not found');
    }

    let phone= '';
    try {
      phone = await this.avvyGetByKey(name, AVVY_PHONE);
    } catch {}

    return { name, phone, address };
  }

  private async avvyGetByKey(name: string, key: number): Promise<string> {
    
    try {
      const abi = parseAbi([ 'function resolveStandard(string name, uint256 key) public view returns (string)' ])

      const address = await this.client.readContract({
        address: this.cfg.avaxContract,
        abi: abi,
        functionName: 'resolveStandard',
        args: [name, key],
      })

      return address;
    } catch (e) {
      return '';
    }
  }

  private async getAvvyPhone(response: any, address: string): Promise<string> {
    const phone = await response.resolve(AVVY.RECORDS.PHONE);

    return phone;
  }

  static async getName(cfg: web3nsConfig, address: string): Promise<string> {

    console.log('address: ', address);

    const client = createPublicClient({
      chain: cfg.avaxChain,
      transport: http(cfg.avaxApi)
    });
  
    const abi = parseAbi([ 'function reverseResolveEVMToName(address addy) public view returns (string)' ])

    const name = await client.readContract({
      address: cfg.avaxContract,
      abi: abi,
      functionName: 'reverseResolveEVMToName',
      args: [address],
    });

    console.log('name: ', name);
    return name || '';
  }
}

export default AvaxLookup;
