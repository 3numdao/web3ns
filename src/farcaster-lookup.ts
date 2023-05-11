import { createPublicClient, http, parseAbi } from 'viem';
import { goerli } from 'viem/chains';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { ALCHEMY_ETH_GOERLI_URL, FARCASTER_NAME_CONTRACT_ADDRESS } from './web3ns-providers';

function asciiToHex(str: string) {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i).toString(16);
    hex += charCode.padStart(2, "0");
  }
  return hex.padEnd(64, "0");
}

class FarcasterLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const client = createPublicClient({
      chain: goerli,
      transport: http(ALCHEMY_ETH_GOERLI_URL + this.ALCHEMY_API_KEY)
    })

    const abi = parseAbi([
      'function ownerOf(uint256 tokenId) public view returns (address)',
    ])

    let address = '';
    try {
      address = await client.readContract({
        address: FARCASTER_NAME_CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'ownerOf',
        args: ['0x' + asciiToHex(name)],
      });
    } catch (error: any) {
      if (error.message.includes('invalid token ID')) {
        throw new Web3nsNotFoundError('Farcaster name was not found');
      } else {
        throw new Web3nsError('Farcaster name lookup failed', 'InternalError');
      }
    }

    const phone = '';
    return { name, address, phone };
  }
}

export default FarcasterLookup;
