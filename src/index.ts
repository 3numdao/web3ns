/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router } from 'itty-router';
import AvaxLookup from './avax-lookup';
import EtherLookup from './ether-lookup';
import LensLookup from './lens-lookup';
import FarcasterLookup from './farcaster-lookup';
import E164Lookup from './e164-lookup';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';

const supportedExtensions: string[] = ['.eth', '.avax', '.lens'];

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  names: KVNamespace;
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

  const ethProvider     = 'https://eth-mainnet.alchemyapi.io/v2/'     + env.ALCHEMY_API_KEY;
  const polygonProvider = 'https://polygon-mainnet.g.alchemy.com/v2/' + env.ALCHEMY_API_KEY;
  const goerliProvider  = 'https://eth-goerli.g.alchemy.com/v2/'      + env.ALCHEMY_API_KEY;

  switch (name.split('.').pop()) {
    case 'eth': {
      const etherLookup = new EtherLookup(ethProvider);
      const result = await etherLookup.execute(name, env.names);
      return result;
    }
    case 'avax': {
      const avaxLookup = new AvaxLookup();
      const result = await avaxLookup.execute(name, env.names);
      return result;
    }
    case 'lens': {
      const lensLookup = new LensLookup(polygonProvider);
      const result = await lensLookup.execute(name, env.names);
      return result;
    }
    default: {
      let result;
      if (name[0] === '+') {
        const e164Lookup = new E164Lookup(ethProvider);
        result = await e164Lookup.execute(name, env.names);
      } else {
        const farcasterLookup = new FarcasterLookup(goerliProvider);
        result = await farcasterLookup.execute(name, env.names);
      }
      return result;
    }
  }
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const router = Router();

    router
      .get('/api/v1/extensions', () => {
        return supportedExtensions;
      })
      .get('/api/v1/lookup/:name', async ({ params }) =>
        handleLookup(params.name, env)
      );

    return (
      router
        .handle(request)
        .then((result) => Response.json(result))
        // TODO: This is wrong. Copy logic from ethercache
        .catch((error) => 
          Response.json( (error instanceof Web3nsError) ? error.toObject() : error.message,
            {
              status: (error instanceof Web3nsError) ? error.httpStatus || 500 : 500,
            }
          )
        )
    );
  },
};
