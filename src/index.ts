import { createCors } from 'itty-cors';
import { Router } from 'itty-router';
import { Web3nsError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';
import AvaxLookup from './avax-lookup';
import E164Lookup from './e164-lookup';
import EtherLookup from './ether-lookup';
import LensLookup from './lens-lookup';
import AddressLookup from './address-lookup';
import type { Env } from './web3ns-providers';

const supportedExtensions: string[] = ['.eth', '.avax', '.lens', '.cb.id', '.fcast.id'];
const { preflight, corsify } = createCors();

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
      const subdomain = nameParts.pop();
      if (subdomain === 'cb') {
        return (new EtherLookup(cfg)).execute(name, env.names);
      } else if (subdomain === 'fcast') {
        return (new EtherLookup(cfg)).execute(name, env.names);
      } else {
        throw new Web3nsError('Invalid name', 'InvalidNameError');
      }
    }
    default: {
      if (name[0] === '+') {
        const e164Lookup = new E164Lookup(cfg);
        return await e164Lookup.execute(name, env.names);
      } else {
        throw new Web3nsError('Invalid name', 'InvalidNameError');
      }
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

    // Temp init the ensDb with some dummy data

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
      .all('*', () => {throw new Web3nsError('API Not found', 'API Not found', 404 )} );

    return (
      router
        .handle(request)
        .then((result) => corsify(Response.json(result)))
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
