export interface LookupData {
  name: string;
  phone: string;
  address: string;
}

export interface AddressLookupData {
  eth: {
    name?: string;
    altNames?: string[];
  },
  avax: {
    name?: string;
    altNames?: string[];
  },
  farcaster: {
    fid?: string;
  },
  // lens: {
  //   name?: string;
  // },
  // cb_id: {
  //   name?: string;
  // },
  // shield: {
  //   tokenId: string;
  // },
}

const ExperationTTL = 5 * 60;

export abstract class LookupBase {
  public abstract doLookup(name: string): Promise<LookupData | AddressLookupData>;

  public async execute(
    name: string,
    namespace: KVNamespace
  ): Promise<LookupData | AddressLookupData> {
    
    const kvItem = (await namespace.get(name, { type: 'json' })) as LookupData | AddressLookupData;

    if (kvItem) {
      return { ...kvItem };
    }

    const lookupData = await this.doLookup(name);

    namespace.put( name,
      JSON.stringify(lookupData),
      { expirationTtl: ExperationTTL }
    );

    console.log('lookupData: ', lookupData);
    return lookupData;
  }
}