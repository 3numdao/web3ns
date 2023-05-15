import { createPublicClient, http, parseAbi } from 'viem';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsNotFoundError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';

class LensLookup extends LookupBase {
  constructor(private cfg: web3nsConfig) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const client = createPublicClient({
      chain: this.cfg.polygonChain,
      transport: http(this.cfg.polygonApi)
    })

    const abi = parseAbi([
      'function getProfileIdByHandle(string) view returns (uint256)',
      'function ownerOf(uint256 tokenId) public view returns (address)',
    ]);

    const profileId = await client.readContract({
      address: this.cfg.lensContract,
      abi: abi,
      functionName: 'getProfileIdByHandle',
      args: [name],
    });

    console.log('profileId: ', profileId);

    // Make sure the profileId is not 0
    if (profileId == BigInt(0) ) {
      throw new Web3nsNotFoundError('Lens name was not found');
    }

    const addr = await client.readContract({
      address: this.cfg.lensContract,
      abi: abi,
      functionName: 'ownerOf',
      args: [profileId],
    });

    const address = addr;
    const phone = '';
    return { name, address, phone };
  }
}

export default LensLookup;
