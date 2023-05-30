import { ethers, BytesLike } from 'ethers';
import {
  Fragment,
  FunctionFragment,
  Interface,
  JsonFragment,
} from '@ethersproject/abi';
import { hexlify } from '@ethersproject/bytes';
import { isAddress, isBytesLike } from 'ethers/lib/utils';
import { Web3nsError } from './models/web3ns-errors';

export interface RPCCall {
  to: BytesLike;
  data: BytesLike;
}

export interface RPCResponse {
  status: number;
  body: any;
}

export type HandlerFunc = (
  args: ethers.utils.Result,
  req: RPCCall
) => Promise<Array<any>> | Array<any>;

interface Handler {
  type: FunctionFragment;
  func: HandlerFunc;
}

function toInterface(
  abi: string | readonly (string | Fragment | JsonFragment)[] | Interface
) {
  if (Interface.isInterface(abi)) {
    return abi;
  }
  return new Interface(abi);
}

function getFunctionSelector(calldata: string): string {
  return calldata.slice(0, 10).toLowerCase();
}

export interface HandlerDescription {
  type: string;
  func: HandlerFunc;
}

/**
 * Implements a CCIP-Read gateway service using itty-router.js.
 *
 * Example usage:
 * ```javascript
 * const ccipread = require('@chainlink/ccip-read-cf-worker');
 * const server = new ccipread.Server();
 * const abi = [
 *   'function getSignedBalance(address addr) public view returns(uint256 balance, bytes memory sig)',
 * ];
 * server.add(abi, [
 *   {
 *     type: 'getSignedBalance',
 *     func: async (contractAddress, [addr]) => {
 *       const balance = getBalance(addr);
 *       const sig = signMessage([addr, balance]);
 *       return [balance, sig];
 *     }
 *   }
 * ]);
 * const app = server.makeApp();
 * module.exports = {
 *  fetch: function (request, _env, _context) {
 *    return app.handle(request)
 *  }
 * };
 * ```
 */
export class Server {
  /** @ignore */
  readonly handlers: { [selector: string]: Handler };

  /**
   * Constructs a new CCIP-Read gateway server instance.
   */
  constructor(private cfg: web3nsConfig) {
    this.handlers = {};
  }

  /**
   * Adds an interface to the gateway server, with handlers to handle some or all of its functions.
   * @param abi The contract ABI to use. This can be in any format that ethers.js recognises, including
   *        a 'Human Readable ABI', a JSON-format ABI, or an Ethers `Interface` object.
   * @param handlers An array of handlers to register against this interface.
   */
  add(
    abi: string | readonly (string | Fragment | JsonFragment)[] | Interface,
    handlers: Array<HandlerDescription>
  ) {
    const abiInterface = toInterface(abi);
    
    for (const handler of handlers) {
      const fn = abiInterface.getFunction(handler.type);

      console.log('ccip-server add: ', Interface.getSighash(fn));

      this.handlers[Interface.getSighash(fn)] = {
        type: fn,
        func: handler.func,
      };
    }
  }

  /**
   * Convenience function to construct an `itty-router` application object for the gateway.
   * Example usage:
   * ```javascript
   * const ccipread = require('@chainlink/ccip-read-cf-worker');
   * const server = new ccipread.Server();
   * // set up server object here
   * const app = server.makeApp('/');
   * module.exports = {
   *  fetch: function (request, _env, _context) {
   *    return app.handle(request)
   *  }
   * };
   * ```
   * The path prefix to `makeApp` will have sender and callData arguments appended.
   * If your server is on example.com and configured as above, the URL template to use
   * in a smart contract would be "https://example.com/{sender}/{callData}.json".
   * @returns An `itty-router.Router` object configured to serve as a CCIP read gateway.
   */

  async handleRequest(sender: string, callData: string) {
    if (!isAddress(sender) || !isBytesLike(callData)) {
      throw new Web3nsError('Invalid sender or callData', 'InvalidRequest', 400);
    }

    try {
      const response = await this.call({ to: sender, data: callData });
      return response.body;
    //   return new Response(JSON.stringify(response.body), {
    //     status: response.status,
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
    } catch (e) {
      throw new Web3nsError(`Internal server error: ${(e as any).toString()}`, 'InternalError', 500);
    }
  }

  async call(call: RPCCall): Promise<RPCResponse> {
    console.log('call.data: ', call.data)
    const calldata = hexlify(call.data);
    console.log('calldata: ', calldata)

    const selector = getFunctionSelector(calldata);

    // Find a function handler for this selector
    const handler = this.handlers[selector];
    //console.log('ccip-server call(): handler: ', handler);

    if (!handler) {
      throw new Web3nsError(`No implementation for function with selector ${selector}`, 'FunctionNotFound', 400);
    }

    //console.log('ccip-server call() calldata: ', call.data);

    // Decode function arguments
    const args = ethers.utils.defaultAbiCoder.decode(
      handler.type.inputs,
      '0x' + calldata.slice(10)
    );

    console.log('ccip-server call(): args: ', args);
    //console.log('ccip-server call(): call: ', call);

    // Call the handler
    const result = await handler.func(args, call);

    console.log('ccip-server call(): result: ', result);

    // Encode return data
    return {
      status: 200,
      body: {
        data: result,
        // data: handler.type.outputs
        //   ? hexlify(
        //       ethers.utils.defaultAbiCoder.encode(handler.type.outputs, result)
        //     )
        //   : '0x',
      },
    };
  }
}
