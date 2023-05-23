import { createCors } from 'itty-cors';
import { Router } from 'itty-router';
import { Web3nsError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';
import AvaxLookup from './avax-lookup';
import E164Lookup from './e164-lookup';
import EtherLookup from './ether-lookup';
import FarcasterLookup from './farcaster-lookup';
import LensLookup from './lens-lookup';
import AddressLookup from './address-lookup';

const supportedExtensions: string[] = ['.eth', '.avax', '.lens', 'cb.id'];
const { preflight, corsify } = createCors();

export interface Env {
  // Binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  names: KVNamespace;
  addresses: KVNamespace;

  ALCHEMY_API_KEY: string;
  
  ENVIRONMENT: string;
}

const handleLookup = async (name: string, env: Env) => {
  if (!env.ALCHEMY_API_KEY) {
    throw new Web3nsError('Provider API key was not given', 'InternalEnvError');
  }

  if (!env.ENVIRONMENT) {
    throw new Web3nsError('ENVIRONMENT was not given', 'InternalEnvError');
  }

  const cfg = web3nsConfig(env.ENVIRONMENT, env.ALCHEMY_API_KEY);

  let nameParts = name.split('.')

  switch (nameParts.pop()) {
    case 'eth': {
      const etherLookup = new EtherLookup(cfg);
      const result = await etherLookup.execute(name, env.names);
      return result;
    }
    case 'avax': {
      const avaxLookup = new AvaxLookup(cfg);
      const result = await avaxLookup.execute(name, env.names);
      return result;
    }
    case 'lens': {
      const lensLookup = new LensLookup(cfg);
      const result = await lensLookup.execute(name, env.names);
      return result;
    }
    case 'id': {
      if (nameParts.pop() === 'cb') {
        return (new EtherLookup(cfg)).execute(name, env.names);
      } else {
        throw new Web3nsError('Invalid name', 'InvalidNameError');
      }
    }
    default: {
      let result;
      if (name[0] === '+') {
        const e164Lookup = new E164Lookup(cfg);
        result = await e164Lookup.execute(name, env.names);
      } else {
        const farcasterLookup = new FarcasterLookup(cfg);
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

  if (!env.ENVIRONMENT) {
    throw new Web3nsError('ENVIRONMENT was not given', 'InternalEnvError');
  }

  const cfg = web3nsConfig(env.ENVIRONMENT, env.ALCHEMY_API_KEY);

  const etherLookup = new AddressLookup(cfg);

  return await etherLookup.execute(address, env.addresses);
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
