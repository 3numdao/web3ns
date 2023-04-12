import { providers, ethers, BigNumber } from 'ethers';
import LookupBase from './lookup-base';
import LookupData from './models/lookup-data';
import NotFoundError from './models/not-found-error';
import RequiredEnvMissing from './models/required-env-missing';

const ALCHEMY_API_URL = 'https://eth-goerli.g.alchemy.com/v2/ZVODbV10AZE1gVClqakv_ZPwTxr2kdAn'

const ALCHEMY_API_SERVER = 'https://eth-goerli.g.alchemy.com/v2/';

const FARCASTER_NAME_CONTRACT_ADDRESS = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';

const ERRORS = Object.freeze({
  REQUIRED_ALCHEMY_API_KEY_ERROR: 'ALCHEMY_API_KEY is a required env var',
  REQUIRED_ALCHEMY_API_KEY_SUGGESTION:
    'Add ALCHEMY_API_KEY as an env var. ' +
    'For local: add ALCHEMY_API_KEY=<your-token> to .dev.var. ' +
    'For hosted worker environment add ALCHEMY_API_KEY to the worker secrets: npx wrangler secret put ALCHEMY_API_KEY',
});

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
    if (!this.ALCHEMY_API_KEY) {
      throw new RequiredEnvMissing(
        ERRORS.REQUIRED_ALCHEMY_API_KEY_ERROR,
        'ALCHEMY_API_KEY',
        ERRORS.REQUIRED_ALCHEMY_API_KEY_SUGGESTION
      );
    }

    const provider = new providers.StaticJsonRpcProvider({
//      url: ALCHEMY_API_URL,
      url: ALCHEMY_API_SERVER + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(FARCASTER_NAME_CONTRACT_ADDRESS, [
      'function ownerOf(uint256 tokenId) public view returns (address)'
    ], provider);

    // Call ownerOf to get the address, handle the case where the name is not found and the call reverts
    let addr;
    try {
      addr = await contract.ownerOf('0x' + asciiToHex(name));
    } catch (e) {
      //if (e.code === -32000) {
      console.log('error: ', e.code);
    }
    //const addr = await contract.ownerOf('0x' + asciiToHex(name));

    const address = addr.toString();
    const phone = '';
    return { name, address, phone };
  }
}

export default FarcasterLookup;
