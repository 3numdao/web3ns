import { providers, ethers, BigNumber } from 'ethers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsNotFoundError } from './models/web3ns-errors';
import { ALCHEMY_POLYGON_MAINNET_URL, LENS_LLP_CONTRACT_ADDRESS } from './web3ns-providers';

class LensLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_POLYGON_MAINNET_URL + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(LENS_LLP_CONTRACT_ADDRESS, [
      'function getProfileIdByHandle(string) view returns (uint256)',
      'function ownerOf(uint256 tokenId) public view virtual override returns (address)'
    ], provider);

    const profileId = await contract.getProfileIdByHandle(name);
  
    // Make sure the profileId is not 0
    if (profileId.eq(0)) {
      throw new Web3nsNotFoundError('Lens name was not found');
    }

    const addr = await contract.ownerOf(profileId);

    const address = addr.toString();
    const phone = '';
    return { name, address, phone };
  }
}

export default LensLookup;
