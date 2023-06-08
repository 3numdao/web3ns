import { createPublicClient, http, parseAbi, toHex } from 'viem';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';

function nameToBigInt(str: string): bigint {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i).toString(16);
    hex += charCode.padStart(2, "0");
  }
  return BigInt('0x' + hex.padEnd(64, "0"));
}

class FarcasterLookup extends LookupBase {
  constructor(private cfg: web3nsConfig) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const client = createPublicClient({
      chain: this.cfg.farcasterChain,
      transport: http(this.cfg.farcasterApi)
    })

    const abi = parseAbi([
      'function ownerOf(uint256 tokenId) public view returns (address)',
    ])

    let address = '';
    try {
      address = await client.readContract({
        address: this.cfg.farcasterNameContract,
        abi: abi,
        functionName: 'ownerOf',
        args: [nameToBigInt(name)],
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
