import { providers, ethers, BigNumber } from 'ethers';
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

    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_ETH_GOERLI_URL + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(FARCASTER_NAME_CONTRACT_ADDRESS, [
      'function ownerOf(uint256 tokenId) public view returns (address)'
    ], provider);

    // Call ownerOf to get the address, handle the case where the name is not found and the call reverts
    let addr;
    try {
      addr = await contract.ownerOf('0x' + asciiToHex(name));
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        throw new Web3nsNotFoundError('Farcaster name was not found');
      } else {
        throw new Web3nsError('Farcaster name lookup failed', 'InternalError');
      }
    }

    const address = addr.toString();
    const phone = '';
    return { name, address, phone };
  }
}

export default FarcasterLookup;
