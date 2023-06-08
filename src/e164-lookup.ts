import { createPublicClient, http, parseAbi, keccak256, encodePacked  } from 'viem';

import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';

class E164Lookup extends LookupBase {
  constructor(private cfg: web3nsConfig) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const client = createPublicClient({
      chain: this.cfg.ethChain,
      transport: http(this.cfg.ethApi)
    });

    // Parse the name to get the number, trimming off the leading + sign
    const number = BigInt(name.substring(1));

    const abi = parseAbi([
      'function ownerOf(uint256 tokenId) public view returns (address)',
    ])

    const tokenId = BigInt(keccak256(encodePacked(['uint56'], [number])));
    
    let address = '';
    try {
  
      address = await client.readContract({
        address: this.cfg.threeNumContract,
        abi: abi,
        functionName: 'ownerOf',
        args: [tokenId],
      });

    } catch (error: any) {
      if (error.message.includes('invalid token ID')) {
        throw new Web3nsNotFoundError('E164 name was not found');
      } else {
        throw new Web3nsError('E164 name lookup failed', 'InternalError');
      }
    }

    const phone = '';
    return { name, address, phone };
  }
}

export default E164Lookup;
