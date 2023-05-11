import { createPublicClient, http, parseAbi } from 'viem';
import { polygon } from 'viem/chains';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsNotFoundError } from './models/web3ns-errors';
import { ALCHEMY_POLYGON_MAINNET_URL, LENS_LLP_CONTRACT_ADDRESS } from './web3ns-providers';

class LensLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const client = createPublicClient({
      chain: polygon,
      transport: http(ALCHEMY_POLYGON_MAINNET_URL + this.ALCHEMY_API_KEY)
    })

    const abi = parseAbi([
      'function getProfileIdByHandle(string) view returns (uint256)',
      'function ownerOf(uint256 tokenId) public view returns (address)',
    ]);

    const profileId = await client.readContract({
      address: LENS_LLP_CONTRACT_ADDRESS,
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
      address: LENS_LLP_CONTRACT_ADDRESS,
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
