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
import { ccipResolveName } from './ccip-resolve';


const supportedExtensions: string[] = ['.eth', '.avax', '.lens', 'cb.id'];
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

const handleCcipResolv = async (address: string, callData: string, env: Env ) => {
  if (!env.ALCHEMY_API_KEY) {
    throw new Web3nsError('Provider API key was not given', 'InternalEnvError');
  }

  if (!env.ENVIRONMENT) {
    throw new Web3nsError('ENVIRONMENT was not given', 'InternalEnvError');
  }

  const cfg = web3nsConfig(env.ENVIRONMENT, env.ALCHEMY_API_KEY);

  return await ccipResolveName(cfg, env.ensDb, address, callData);
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const router = Router();

    // Temp init the ensDb with some dummy data
    await env.ensDb.put( '12065551212.e164.eth',
      JSON.stringify({
        owner: '0x3311111111111111111111111111111111111122',
        addresses: {
          60: '0x3311111111111111111111111111111111111122',
        },
        text: {
          'com.twitter': 'foobar',
          '3NUM': '12065551212'
        }
      })
    );

    console.log('ensDb: ', await env.ensDb.get('12065551212.e164.eth', { type: 'json' }));

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
      .get('/r/:sender/:callData', async ({ params }) => 
        handleCcipResolv(params.sender, params.callData, env)
      )
      .all('*', () => {throw new Web3nsError('API Not found', 'API Not found', 404 )} );

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
