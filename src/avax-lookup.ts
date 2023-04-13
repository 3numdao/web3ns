import AVVY from '@avvy/client';
import { providers } from 'ethers';
import LookupBase from './lookup-base';
import LookupData from './models/lookup-data';
import Web3nsNotFoundError from './models/web3ns-errors';

class AvaxLookup extends LookupBase {
  public async doLookup(name: string): Promise<LookupData> {
    const response = await this.getAvvyResponse(name);

    let address;
    try {
      address = await this.getAvvyAddress(response);
    } catch (e) {
      throw new Web3nsNotFoundError('Avvy name was not found');
    }

    let phone= '';
    try {
      phone = await this.getAvvyPhone(response, address);
    } catch {}

    return { name, phone, address };
  }

  private async getAvvyResponse(name: string) {
    const PROVIDER_URL = 'https://api.avax.network/ext/bc/C/rpc';

    const provider = new providers.StaticJsonRpcProvider({
      url: PROVIDER_URL,
      skipFetchSetup: true,
    });

    const avvy = new AVVY(provider);
    const response = await avvy.name(name);
    
    if (!response) {
      throw new Web3nsNotFoundError('Avvy name was not found');
    }

    return response;
  }

  private async getAvvyAddress(response: any): Promise<string> {
    let address = await response.resolve(AVVY.RECORDS.EVM);
    address ||= await response.resolve(AVVY.RECORDS.P_CHAIN);
    address ||= await response.resolve(AVVY.RECORDS.X_CHAIN);

    return address;
  }

  private async getAvvyPhone(response: any, address: string): Promise<string> {
    const phone = await response.resolve(AVVY.RECORDS.PHONE);

    return phone;
  }
}

export default AvaxLookup;
