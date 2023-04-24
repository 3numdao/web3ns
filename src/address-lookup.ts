import { ethers, providers } from 'ethers';
import AVVY from '@avvy/client'
import { LookupBase, LookupData, AddressLookupData } from './models/lookup';
import { ALCHEMY_ETH_MAINNET_URL, ALCHEMY_ETH_GOERLI_URL, AVAX_MAINNET_URL, FARCASTER_ID_CONTRACT_ADDRESS } from './web3ns-providers';

class AddressLookup extends LookupBase {
  constructor(private ALCHEMY_API_KEY: string) {
    super();
  }

  public async doLookup(address: string): Promise<LookupData | AddressLookupData> {

    const [eth, avax, farcaster] = await Promise.all([this.getEth(address), this.getAvvy(address), this.getFarcaster(address)]);

    return { eth: {  name: eth }, avax: { name: avax }, farcaster: farcaster };
  }

  private async getEth(address: string): Promise<string> {

    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_ETH_MAINNET_URL + this.ALCHEMY_API_KEY,
      skipFetchSetup: true,
    });

    return await provider.lookupAddress(address) || '';
  }

  private async getFarcaster(address: string): Promise<{ name: string, fid: string }> {
    const provider = new providers.StaticJsonRpcProvider({
      url: ALCHEMY_ETH_GOERLI_URL + this.ALCHEMY_API_KEY,
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

    const provider = new providers.StaticJsonRpcProvider({
      url: AVAX_MAINNET_URL,
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
