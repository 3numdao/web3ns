import { createPublicClient, http, parseAbi } from 'viem';
import { ethers } from 'ethers';
import AVVY from '@avvy/client';
import { LookupBase, LookupData, AddressLookupData } from './models/lookup';
import { web3nsConfig } from './web3ns-providers';

class AddressLookup extends LookupBase {
  constructor(private cfg: web3nsConfig) {
    super();
  }

  public async doLookup(address: `0x${string}`): Promise<LookupData | AddressLookupData> {

    const [eth, avax, farcaster] = await Promise.all([this.getEth(address), this.getAvvy(address), this.getFarcaster(address)]);

    return { eth: {  name: eth }, avax: { name: avax }, farcaster: farcaster };
  }

  private async getEth(address: `0x${string}`): Promise<string> {

    const client = createPublicClient({
      chain: this.cfg.ethChain,
      transport: http(this.cfg.ethApi)
    })
 
    return await client.getEnsName({address: address}) || '';
  }

  private async getFarcaster(address: `0x${string}`): Promise<{ name: string, fid: string }> {
    const client = createPublicClient({
      chain: this.cfg.farcasterChain,
      transport: http(this.cfg.farcasterApi)
    })

    const abi = parseAbi([
      'function idOf(address a) public view returns (uint256)'
    ]);

    const fid = await client.readContract({
      address: this.cfg.farcasterIdContract,
      abi: abi,
      functionName: 'idOf',
      args: [address],
    }) || '';

    const name = '';
    return { name: name, fid: fid.toString() };
  }
  
  private async getAvvy(address: string): Promise<string> {

    const provider = new ethers.providers.StaticJsonRpcProvider({
      url: this.cfg.avaxApi,
      skipFetchSetup: true,
    });

    // Lookup Avvy name
    let avax = '';
    try {
      const avvy = new AVVY(provider)
      const hash = await avvy.reverse(AVVY.RECORDS.EVM, address)
      avax = (await hash.lookup()).name
      
    } catch {}

    return avax;
  }
}

export default AddressLookup;
