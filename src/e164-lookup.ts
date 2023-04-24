import { providers, ethers, BigNumber } from 'ethers';
import { LookupData, LookupBase } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { ALCHEMY_ETH_MAINNET_URL, THREE_NUM_CONTRACT_ADDRESS } from './web3ns-providers';

class E164Lookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(name: string): Promise<LookupData> {
    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_ETH_MAINNET_URL + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(THREE_NUM_CONTRACT_ADDRESS, [
      'function ownerOf(uint256 tokenId) public view returns (address)',
      'function e164uintToTokenId(uint56 _number) public pure returns (uint256)'
    ], provider);

    const number = ethers.BigNumber.from(name.substring(1));

    // Call ownerOf to get the address, handle the case where the name is not found and the call reverts
    let addr;
    try {
      const tokenId = await contract.e164uintToTokenId(number);
      addr = await contract.ownerOf(tokenId);
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        throw new Web3nsNotFoundError('E164 name was not found');
      } else {
        throw new Web3nsError('E164 name lookup failed', 'InternalError');
      }
    }

    const address = addr.toString();
    const phone = '';
    return { name, address, phone };
  }
}

export default E164Lookup;
