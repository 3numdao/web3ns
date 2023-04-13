import { providers, ethers, BigNumber } from 'ethers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsNotFoundError } from './models/web3ns-errors';

const LENS_LLP_CONTRACT_ADDRESS = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';

class LensLookup extends LookupBase {
  constructor(private ALCHEMY_API_URL: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {

    const provider = new providers.StaticJsonRpcProvider({
      url: this.ALCHEMY_API_URL,
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
