import { ethers, providers } from 'ethers';
import AVVY from '@avvy/client'
import { LookupBase, LookupData,AddressLookupData } from './models/lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const FARCASTER_NAME_CONTRACT_ADDRESS = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
const FARCASTER_ID_CONTRACT_ADDRESS = '0xDA107A1CAf36d198B12c16c7B6a1d1C795978C42';

class AddressLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(address: string): Promise<LookupData | AddressLookupData> {

    const [eth, avax, farcaster] = await Promise.all([this.getEth(address), this.getAvvy(address), this.getFarcaster(address)]);

    return { eth: {  name: eth }, avax: { name: avax }, farcaster: farcaster };
  }

  private async getEth(address: string): Promise<string> {
    const ethProvider =
    'https://eth-mainnet.alchemyapi.io/v2/' + this.ALCHEMY_API_KEY;

    const provider = new providers.StaticJsonRpcProvider({
      url: ethProvider,
      skipFetchSetup: true,
    });

    return await provider.lookupAddress(address) || '';
  }

  private async getFarcaster(address: string): Promise<{ name: string, fid: string }> {
    const provider = new providers.StaticJsonRpcProvider({
      url: 'https://eth-goerli.g.alchemy.com/v2/' + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    const contract = new ethers.Contract(FARCASTER_ID_CONTRACT_ADDRESS, [
      'function idOf(address a) public view returns (uint256)'
    ], provider);

    // Call ownerOf to get the address, handle the case where the name is not found and the call reverts
    let fid = '';
    try {
      const results = await contract.idOf(address);

        // if result is 0, then the address is not registered, 
      fid = results.eq(0) ? '' : results.toString();

    } catch {}

    return { fid: fid };
  }
  
  private async getAvvy(address: string): Promise<string> {
    const PROVIDER_URL = 'https://api.avax.network/ext/bc/C/rpc';

    const provider = new providers.StaticJsonRpcProvider({
      url: PROVIDER_URL,
      skipFetchSetup: true,
    });

    // Lookup Avvy name
    let avax = '';
    try {
      const avvy = new AVVY(provider)
      const hash = await avvy.reverse(AVVY.RECORDS.EVM, address)
      avax = await hash.lookup()
    } catch {}

    return avax;
  }
}

export default AddressLookup;
