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
import NotFoundError from './models/not-found-error';

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
}

const handleLookup = async (name: string, env: Env) => {
  switch (name.split('.').pop()) {
    case 'eth': {
      const etherLookup = new EtherLookup(env.ALCHEMY_API_KEY);
      const result = await etherLookup.execute(name, env.names);
      return result;
    }
    case 'avax': {
      const avaxLookup = new AvaxLookup();
      const result = await avaxLookup.execute(name, env.names);
      return result;
    }
    case 'lens': {
      const lensLookup = new LensLookup(env.ALCHEMY_API_KEY);
      const result = await lensLookup.execute(name, env.names);
      return result;
    }
    default: {
      const farcasterLookup = new FarcasterLookup(env.ALCHEMY_API_KEY);
      const result = await farcasterLookup.execute(name, env.names);
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
          Response.json(
            error.toInformativeObject
              ? error.toInformativeObject()
              : error.getMessage(),
            {
              status: error.code || 500,
            }
          )
        )
    );
  },
};
