import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { ALCHEMY_ETH_MAINNET_URL, THREE_NUM_CONTRACT_ADDRESS } from './web3ns-providers';

class E164Lookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    console.log('e164 doLookup name: ', name);

    const client = createPublicClient({
      chain: mainnet,
      transport: http(ALCHEMY_ETH_MAINNET_URL + this.ALCHEMY_API_KEY)
    });

    // Parse the name to get the number, trimming off the leading + sign
    const number = BigInt(name.substring(1));

    const abi = parseAbi([
      'function ownerOf(uint256 tokenId) public view returns (address)',
      'function e164uintToTokenId(uint56 _number) public pure returns (uint256)'
    ])

    const tokenId = await client.readContract({
      address: THREE_NUM_CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'e164uintToTokenId',
      args: [number],
    });

    let address = '';
    try {
  
      address = await client.readContract({
        address: THREE_NUM_CONTRACT_ADDRESS,
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
