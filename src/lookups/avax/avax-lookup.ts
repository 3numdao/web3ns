import LookupBase from '../../base/lookup-base';
import LookupData from '../../models/lookup-data';

import AVVY from '@avvy/client';
import { providers } from 'ethers';
import NotFoundError from '../../models/not-found-error';

class AvaxLookup extends LookupBase {
  public async doLookup(name: string): Promise<LookupData> {
    const response = await this.getAvvyResponse(name);

    const address = await this.getAvvyAddress(response);

    const phone = await this.getAvvyPhone(response, address);

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
      throw new NotFoundError('Avvy name was not found', 'AvvyNotFound', null);
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
    if (!phone) {
      throw new NotFoundError(
        'Avvy name did not have a phone number',
        'PhoneNotFound',
        address
      );
    }

    return phone;
  }
}

export default AvaxLookup;
