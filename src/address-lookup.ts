import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, goerli } from 'viem/chains';
import { ethers } from 'ethers';
import AVVY from '@avvy/client';
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

    const client = createPublicClient({
      chain: mainnet,
      transport: http(ALCHEMY_ETH_MAINNET_URL + this.ALCHEMY_API_KEY)
    })
 
    return await client.getEnsName({address: address}) || '';
  }

  private async getFarcaster(address: string): Promise<{ name: string, fid: string }> {
    const client = createPublicClient({
      chain: goerli,
      transport: http(ALCHEMY_ETH_GOERLI_URL + this.ALCHEMY_API_KEY)
    })

    const abi = parseAbi([
      'function idOf(address a) public view returns (uint256)'
    ]);

    const fid = await client.readContract({
      address: FARCASTER_ID_CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'idOf',
      args: [address],
    }) || '';

    const name = '';
    return { name: name, fid: fid.toString() };
  }
  
  private async getAvvy(address: string): Promise<string> {

    const provider = new ethers.providers.StaticJsonRpcProvider({
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
