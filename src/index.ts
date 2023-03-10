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
import AvaxLookup from './lookups/avax/avax-lookup';
import NotFoundError from './models/not-found-error';

const avaxLookup = new AvaxLookup();

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  NAMES: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const router = Router();

    router.get('/api/v1/lookup/:name', async ({ params }) => {
      const result = await avaxLookup.execute(params.name, env.NAMES);
      return JSON.stringify(result);
    });

    return (
      router
        .handle(request)
        .then((result) => new Response(result))
        // TODO: This is wrong. Copy logic from ethercache
        .catch(
          (error) =>
            new Response(
              error.toInformativeObject
                ? error.toInformativeObject()
                : error.getMessage(),
              {
                status: error.status || 500,
              }
            )
        )
    );
  },
};
