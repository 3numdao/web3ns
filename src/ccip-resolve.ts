import { createPublicClient, http, parseAbi, zeroAddress, Address, createWalletClient, encodeAbiParameters } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts' 
import { ethers } from 'ethers';


import type { BytesLike } from 'ethers';
import { web3nsConfig } from './web3ns-providers';

const TTL_SECONDS: number = 300 // 5 minutes

export async function resultHash( cfg: web3nsConfig, expires: bigint, request: `0x${string}`, result: `0x${string}`): Promise<string> {

    const abi = parseAbi([
        'function makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32)'
    ]);

  const client = createPublicClient({
    chain: cfg.ethChain,
    transport: http('http://127.0.0.1:8545')
  });

  return client.readContract({
    address: '0xC5273AbFb36550090095B1EDec019216AD21BE6c',
    abi: abi,
    functionName: 'makeSignatureHash',
    args: [expires, request, result],
  });
}


// func: async ([name, callData], data) => {
//     console.log(`ccip-server resolve(): contractAddress(${data.to}) name: `, name);

//     // Lookup the name using e164-lookup
//     // Hash the returned senderAddress, expirey, callData, encodedAddress
//     // makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32) 
    
//     // Sign th
//     return resolveName(cfg, data.to, name, callData);
//   }


function decodeDNSName(encoded: Uint8Array): string {
    let offset: number = 0;
    let decoded: string = "";
  
    while (offset < encoded.length) {
      const labelLength: number = encoded[offset];
  
      if (labelLength === 0) {
        // Null label indicates the end of the DNS name
        break;
      }
  
      if (labelLength > 63) {
        throw new Error("Label too long");
      }
  
      const labelBytes: Uint8Array = encoded.slice(offset + 1, offset + 1 + labelLength);
      const label: string = new TextDecoder().decode(labelBytes);
  
      if (decoded.length > 0) {
        decoded += ".";
      }
  
      decoded += label;
  
      offset += 1 + labelLength;
    }
  
    console.log('decoded: ', decoded)
    return decoded;
  }
  
  
export async function resolveName(cfg: web3nsConfig, sender: BytesLike, byteName: Uint8Array, data: `0x${string}`, callData: `0x${string}`): Promise<string> {

    const expires: bigint = BigInt(Math.floor(Date.now() / 1000) + TTL_SECONDS);
    //const expires: bigint = BigInt(0x64754d00)

    // Initialize addr with the Ethereum zero address
    let addr: Address = zeroAddress;

    // Lookup the name using e164-lookup
    // Hash the returned senderAddress, expirey, callData, encodedAddress
    // makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32) 

    console.log('resolveName: ', byteName);
    const name = decodeDNSName(byteName);
    console.log('decoded name: ', name);

    const client = createPublicClient({
        chain: hardhat,
        transport: http(cfg.ethApi)
    });

    // Confirm the the name hashes to callDate name node
    if (name === "pete.cbdev.eth") {
        addr = ethers.utils.getAddress('0x1111111111111111111111111111111111111111');
        const addressBytes32 = ethers.utils.arrayify(addr);
        addr = ethers.utils.hexZeroPad(addressBytes32, 32)
    }

    console.log( 'returning addr: ', addr );

    // Sign the hash with signer (0x9858EfFD232B4033E47d90003D41EC34EcaEda94)
    const account = privateKeyToAccount('0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727'); 
    const signer = new ethers.Wallet('0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727');

    const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http(cfg.ethApi)
    })

    console.log('callData: ', callData);
    const hash = await resultHash(cfg, expires, callData, addr);

    console.log('hash: ', hash)

    // const signature = await walletClient.signMessage({ 
    //     account,
    //     message: hash,
    //   })

    const signature = await signer.signMessage(ethers.utils.arrayify(hash));

    //   function verify(bytes calldata request, bytes calldata response)
    //   internal
    //   view
    //   returns (address, bytes memory)

    const res = encodeAbiParameters(
        [
          { name: 'result', type: 'bytes' },
          { name: 'expires', type: 'uint64' },
          { name: 'sig', type: 'bytes' }
        ],
        [addr, expires, signature]
      )
      
    console.log('res: ', res);
    return res;
}

// return ['0x2222221111111111111111111111111111222222', '0x3b3b57dedf3c00aa5b3bc7d88848f2d8b2e81b44568930855876719d3d256e1615fddc05']