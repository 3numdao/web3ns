import {
  createPublicClient,
  http,
  parseAbi,
  zeroAddress,
  Address,
  createWalletClient,
  encodeAbiParameters,
  decodeFunctionData,
  toBytes,
  pad,
} from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ethers } from 'ethers';
import { isAddress, isBytesLike } from 'ethers/lib/utils';
import { Web3nsError } from './models/web3ns-errors';

import { web3nsConfig } from './web3ns-providers';

const TTL_SECONDS: number = 300; // 5 minutes

async function resultHash(
  cfg: web3nsConfig,
  expires: bigint,
  request: `0x${string}`,
  result: `0x${string}`
): Promise<string> {
  const abi = parseAbi([
    'function makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32)',
  ]);

  const client = createPublicClient({
    chain: cfg.ethChain,
    transport: http('http://127.0.0.1:8545'),
  });

  return client.readContract({
    address: '0xC5273AbFb36550090095B1EDec019216AD21BE6c',
    abi: abi,
    functionName: 'makeSignatureHash',
    args: [expires, request, result],
  });
}

function decodeDNSName(encoded: Uint8Array): string {
  let offset: number = 0;
  let decoded: string = '';

  while (offset < encoded.length) {
    const labelLength: number = encoded[offset];

    if (labelLength === 0) {
      // Null label indicates the end of the DNS name
      break;
    }

    if (labelLength > 63) {
      throw new Error('Label too long');
    }

    const labelBytes: Uint8Array = encoded.slice(
      offset + 1,
      offset + 1 + labelLength
    );
    const label: string = new TextDecoder().decode(labelBytes);

    if (decoded.length > 0) {
      decoded += '.';
    }

    decoded += label;

    offset += 1 + labelLength;
  }

  return decoded;
}

export async function ccipResolveName(
  cfg: web3nsConfig,
  sender: `0x${string}`,
  callData: `0x${string}`
) {

  if (!isAddress(sender) || !isBytesLike(callData)) {
    throw new Web3nsError('Invalid sender or callData', 'InvalidRequest', 400);
  }

  console.log('ccipResolveName sender: ', sender);
  console.log('ccipResolveName callData: ', callData);

  // Signature of contract function we are responding to
  const abi = parseAbi([
    'function resolve(bytes name, bytes data) view returns (bytes response)',
  ]);

  // Decode function arguments (this throws an error if the callData doesn't match abi)
  const { functionName, args } = decodeFunctionData({
      abi: abi,
      data: callData
  });

  console.log('functionName: ', functionName);
  console.log('args: ', args);

  // Verify that functionName is 'resolve'
  if (functionName !== 'resolve') {
    throw new Web3nsError(`Invalid function name ${functionName}`, 'InvalidRequest', 400);
  }

  //  const name = decodeDNSName(hexStringToUint8Array(args[0]));
  const name = decodeDNSName(toBytes(args[0]));
  console.log('decoded DNS name: ', name);

  
  const client = createPublicClient({
    chain: hardhat,
    transport: http('http://127.0.0.1:8545'),
  });

  // Confirm the the name hashes to callDate name node
  // Initialize addr with the Ethereum zero address
  let addr: Address = zeroAddress;

  if (name === 'pete.cbdev.eth') {
    addr = '0x1111111111111111111111111111111111111111';
  }

  addr = pad(addr, { size: 32 });

  console.log('returning addr: ', addr);

  // Sign the hash with signer (0x9858EfFD232B4033E47d90003D41EC34EcaEda94)
  const account = privateKeyToAccount(
    '0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727'
  );
  const signer = new ethers.Wallet(
    '0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727'
  );

  const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http('http://127.0.0.1:8545'),
  });

  const expires: bigint = BigInt(Math.floor(Date.now() / 1000) + TTL_SECONDS);

  console.log('callData: ', callData);
  const hash = await resultHash(cfg, expires, callData, addr);

  // console.log(`Signing hash(${hash}) with signer: `, walletClient.account.address);

  // const signature = await walletClient.signMessage({
  //     account,
  //     message: hash,
  //   })

  console.log(`Signing hash(${hash}) with ether signer: `, signer.address);
//  const signature = await signer.signMessage(ethers.utils.arrayify(hash));

  const sig = signer._signingKey().signDigest(hash);

  const signature = ethers.utils.hexConcat([sig.r, sig.s, [sig.v]]);

  const res = encodeAbiParameters(
    [
      { name: 'result', type: 'bytes' },
      { name: 'expires', type: 'uint64' },
      { name: 'sig', type: 'bytes' },
    ],
    [addr, expires, signature]
  );

  console.log('res: ', res);
  return { data: res}
}


  
  // Lookup the name using e164-lookup
  // Hash the returned senderAddress, expirey, callData, encodedAddress
  // makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32)

async function handleLookup(name: string, callData: `0x${string}`, env: Env) [

]