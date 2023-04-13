import KVItem from './kv-item';

export interface LookupData {
  name: string;
  phone: string;
  address: string;
}

export abstract class LookupBase {
  public abstract doLookup(name: string): Promise<LookupData>;

  public async execute(
    name: string,
    namespace: KVNamespace
  ): Promise<LookupData> {
    const kvItem = await this.getName(name, namespace);

    if (kvItem) {
      return { name, ...kvItem };
    }

    const lookupData = await this.doLookup(name);
    await this.saveName(lookupData, namespace);

    return lookupData;
  }

  public async saveName(
    lookup: LookupData,
    namespace: KVNamespace,
    ttlMinutes = 5
  ): Promise<void> {
    return namespace.put(
      lookup.name,
      JSON.stringify({ address: lookup.address, phone: lookup.phone }),
      { expirationTtl: ttlMinutes * 60 }
    );
  }

  // TODO: Use cacheTtl here?
  public async getName(
    name: string,
    namespace: KVNamespace /*, cacheTtlMinutes = 5*/
  ): Promise<KVItem | null> {
    const kvItem = (await namespace.get(name, {
      type: 'json',
      /*cacheTtl: cacheTtlMinutes * 60,*/
    })) as KVItem;

    return kvItem;
  }
}