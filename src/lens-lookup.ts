import { providers, ethers, BigNumber } from 'ethers';
import LookupBase from './lookup-base';
import LookupData from './models/lookup-data';
import NotFoundError from './models/not-found-error';
import RequiredEnvMissing from './models/required-env-missing';

const ALCHEMY_API_SERVER = 'https://polygon-mainnet.g.alchemy.com/v2/'; // https://eth-mainnet.alchemyapi.io/v2/';

const LENS_LLP_CONTRACT_ADDRESS = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';

const ERRORS = Object.freeze({
  REQUIRED_ALCHEMY_API_KEY_ERROR: 'ALCHEMY_API_KEY is a required env var',
  REQUIRED_ALCHEMY_API_KEY_SUGGESTION:
    'Add ALCHEMY_API_KEY as an env var. ' +
    'For local: add ALCHEMY_API_KEY=<your-token> to .dev.var. ' +
    'For hosted worker environment add ALCHEMY_API_KEY to the worker secrets: npx wrangler secret put ALCHEMY_API_KEY',
});

class LensLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    if (!this.ALCHEMY_API_KEY) {
      throw new RequiredEnvMissing(
        ERRORS.REQUIRED_ALCHEMY_API_KEY_ERROR,
        'ALCHEMY_API_KEY',
        ERRORS.REQUIRED_ALCHEMY_API_KEY_SUGGESTION
      );
    }

    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_API_SERVER + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(LENS_LLP_CONTRACT_ADDRESS, [
      'function getProfileIdByHandle(string) view returns (uint256)',
      'function ownerOf(uint256 tokenId) public view virtual override returns (address)'
    ], provider);

    const profileId = await contract.getProfileIdByHandle(name);
  
    // Make sure the profileId is not 0
    if (profileId.eq(0)) {
      throw new NotFoundError('Lens name was not found', 'LensNotFound', null);
    }

    const addr = await contract.ownerOf(profileId);

    const address = addr.toString();
    const phone = '';
    return { name, address, phone };
  }
}

export default LensLookup;
