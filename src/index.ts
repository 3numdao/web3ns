import { createCors } from 'itty-cors';
import { Router } from 'itty-router';
import AvaxLookup from './avax-lookup';
import E164Lookup from './e164-lookup';
import EtherLookup from './ether-lookup';
import FarcasterLookup from './farcaster-lookup';
import LensLookup from './lens-lookup';
import AddressLookup from './address-lookup';
import { Web3nsError } from './models/web3ns-errors';
import { providers } from 'ethers';

const ALCHEMY_ETH_MAINNET_URL     = 'https://eth-mainnet.alchemyapi.io/v2/';
const ALCHEMY_POLYGON_MAINNET_URL = 'https://polygon-mainnet.g.alchemy.com/v2/';
const ALCHEMY_ETH_GOERLI_URL      = 'https://eth-goerli.g.alchemy.com/v2/';

const supportedExtensions: string[] = ['.eth', '.avax', '.lens'];
const { preflight, corsify } = createCors();

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  names: KVNamespace;
  addresses: KVNamespace;

  ALCHEMY_API_KEY: string;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  ETH_API_SERVER: string;
}

const handleLookup = async (name: string, env: Env) => {
  if (!env.ALCHEMY_API_KEY) {
    throw new Web3nsError('Provider API key was not given', 'InternalEnvError');
  }

  switch (name.split('.').pop()) {
    case 'eth': {
      const etherLookup = new EtherLookup(ALCHEMY_ETH_MAINNET_URL + env.ALCHEMY_API_KEY);
      const result = await etherLookup.execute(name, env.names);
      return result;
    }
    case 'avax': {
      const avaxLookup = new AvaxLookup();
      const result = await avaxLookup.execute(name, env.names);
      return result;
    }
    case 'lens': {
      const lensLookup = new LensLookup(ALCHEMY_POLYGON_MAINNET_URL + env.ALCHEMY_API_KEY);
      const result = await lensLookup.execute(name, env.names);
      return result;
    }
    default: {
      let result;
      if (name[0] === '+') {
        const e164Lookup = new E164Lookup(ALCHEMY_ETH_MAINNET_URL + env.ALCHEMY_API_KEY);
        result = await e164Lookup.execute(name, env.names);
      } else {
        const farcasterLookup = new FarcasterLookup(ALCHEMY_ETH_GOERLI_URL + env.ALCHEMY_API_KEY);
        result = await farcasterLookup.execute(name, env.names);
      }
      return result;
    }
  }
};

const handleAddressLookup = async (address: string, env: Env) => {
  if (!env.ALCHEMY_API_KEY) {
    throw new Web3nsError('Provider API key was not given', 'InternalEnvError');
  }

  const etherLookup = new AddressLookup(env.ALCHEMY_API_KEY);

  return await etherLookup.execute(address, env.names);
}


export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const router = Router();

    router
      .all('*', (req) => preflight(req as any))
      .get('/api/v1/extensions', () => {
        return supportedExtensions;
      })
      .get('/api/v1/lookup/:name', async ({ params }) =>
        handleLookup(params.name, env)
      )
      .get('/api/v1/address/:address', async ({ params }) =>
        handleAddressLookup(params.address, env)
      )
      .all('*', () => {throw new Web3nsError('URL Not found', 'URL Not found', 404 )} );

    return (
      router
        .handle(request)
        .then((result) => corsify(Response.json(result)))
        // TODO: This is wrong. Copy logic from ethercache
        .catch((error) =>
          corsify(
            Response.json(
              error instanceof Web3nsError ? error.toObject() : error.message,
              {
                status:
                  error instanceof Web3nsError ? error.httpStatus || 500 : 500,
              }
            )
          )
        )
    );
  },
};
