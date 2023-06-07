import {
  http,
  parseAbi,
  zeroAddress,
  Address,
  encodeAbiParameters,
  decodeFunctionData,
  toBytes,
  pad,
  keccak256,
  encodePacked,
  namehash,
  concat,
  toHex
} from 'viem';
import { normalize } from 'viem/ens';
import { ethers } from 'ethers';
import { isAddress, isBytesLike } from 'ethers/lib/utils';
import { Web3nsError } from './models/web3ns-errors';

import { web3nsConfig } from './web3ns-providers';
import { queryName } from './ens-kv';

export const ETH_COIN_TYPE = 60;
export const EMPTY_CONTENT_HASH = '0x' as `0x${string}`;
const TTL_SECONDS: number = 300; // 5 minutes

function resultHash(
  expires: bigint,
  request: `0x${string}`,
  result: `0x${string}`
): string {  
  return keccak256(encodePacked(
    ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
    [
      '0x1900',
      '0xC5273AbFb36550090095B1EDec019216AD21BE6c',
      expires,
      keccak256(request || '0x'),
      keccak256(result),
    ]
  ));
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
  ensDb: KVNamespace,
  sender: `0x${string}`,
  callData: `0x${string}`
) {
  try {
    return await ccipResolveName2(cfg, ensDb, sender, callData);
  } catch (error) {
    console.log('ccipResolveName2 failed: ', error);
  }
}

export async function ccipResolveName2(
  cfg: web3nsConfig,
  ensDb: KVNamespace,
  sender: `0x${string}`,
  callData: `0x${string}`
) {

  if (!isAddress(sender) || !isBytesLike(callData)) {
    throw new Web3nsError('Invalid sender or callData', 'InvalidRequest', 400);
  }

  // Ensure sender is the ccip contract
  if (sender !== cfg.threeNumEnsContract) {
    throw new Web3nsError(`Invalid sender contract ${sender}`, 'InvalidRequest', 400);
  }

  // Signature of contract function we are responding to
  const abi = parseAbi([
    'function resolve(bytes name, bytes data) view returns (bytes response)',
  ]);

  // Decode function arguments (this throws an error if the callData doesn't match abi)
  const { functionName, args } = decodeFunctionData({
      abi: abi,
      data: callData
  });

  // Verify that functionName is 'resolve'
  if (functionName !== 'resolve') {
    throw new Web3nsError(`Invalid function name ${functionName}`, 'InvalidRequest', 400);
  }

  //  const name = decodeDNSName(hexStringToUint8Array(args[0]));
  const name = decodeDNSName(toBytes(args[0]));

  const result = await handleLookup(cfg, name, args[1]);

  // Sign the hash with signer (0x9858EfFD232B4033E47d90003D41EC34EcaEda94)
  const signer = new ethers.Wallet(
    '0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727'
  );

  const expires: bigint = BigInt(Math.floor(Date.now() / 1000) + TTL_SECONDS);

  const hash = resultHash(expires, callData, result);

  // I can't find Viem support to replace this ethers call
  const sig = signer._signingKey().signDigest(hash);

  const signature = concat([sig.r as `0x${string}`, sig.s as `0x${string}`, toHex(sig.v)]);

  const res = encodeAbiParameters(
    [
      { name: 'result', type: 'bytes' },
      { name: 'expires', type: 'uint64' },
      { name: 'sig', type: 'bytes' },
    ],
    [result, expires, signature]
  );

  return { data: res}
}


  
  // Lookup the name using e164-lookup
  // Hash the returned senderAddress, expirey, callData, encodedAddress
  // makeSignatureHash(uint64 expires, bytes calldata request, bytes calldata result) external view returns (bytes32)

async function handleLookup(cfg: web3nsConfig, name: string, callData: `0x${string}`): Promise<`0x${string}`> {
  // Confirm the the name hashes to callDate name node
  // Initialize addr with the Ethereum zero address

  // Signature of contract function we are responding to
  const abi = parseAbi([
    'function addr(bytes32 node) view returns (bytes response)',
    'function addr(bytes32 node, uint256 coinType) view returns (bytes response)',
    'function text(bytes32 node, string key) view returns (string response)',
    'function pubkey(bytes32 node) view returns (bytes32 x, bytes32 y)',
    'function contenthash(bytes32 node) view returns (bytes response)',
  ]);

  // Decode function arguments (this throws an error if the callData doesn't match abi)
  const { functionName, args } = decodeFunctionData({
      abi: abi,
      data: callData
  });

  // Confirm that name is normalized and hashes to the name node
  if ( namehash(name) !== args[0]) {
    throw new Web3nsError(`Invalid name ${name}`, 'InvalidRequest', 400);
  }
  
  if (normalize(name) !== name) {
    throw new Web3nsError(`Invalid name ${name}`, 'InvalidRequest', 400);
  }

  const nameData = await queryName(cfg, name);

  // Return 404 Not Found if name is not found
  console.log('nameData: ', nameData);

  switch (functionName) {
    case 'addr': {
      const addr: Address = nameData?.addresses?.[ETH_COIN_TYPE] || zeroAddress;

      return pad(addr, { size: 32 });
    }

    case 'text': {
      console.log('text argv-1: ', args[1]);
      let text: string = nameData?.text?.[args[1]] || '' 

      console.log('responding with text: ', text);

      return encodeAbiParameters(
          [{ name: 'response', type: 'string' }],
          [text]
      );
    }

    case 'contenthash': {
      const contenthash: `0x${string}` = nameData?.contenthash || EMPTY_CONTENT_HASH;

      return encodeAbiParameters(
        [{ name: 'response', type: 'bytes' }],
        [contenthash]
      );
    }

    case 'pubkey': {
      console.warn('pubkey not implemented');
      throw new Web3nsError(`pubkey not implemented`, 'InvalidRequest', 400);
    }

    default: {
      throw new Web3nsError(`Invalid sub function name ${functionName}`, 'InvalidRequest', 400);
    }
  }  
}

// 
// ENS Text records
//
// avatar - a URL to an image used as an avatar or logo
// description - A description of the name
// display - a canonical display name for the ENS name; this MUST match the ENS name when its case is folded, and clients should ignore this value if it does not (e.g. "ricmoo.eth" could set this to "RicMoo.eth")
// email - an e-mail address
// keywords - A list of comma-separated keywords, ordered by most significant first; clients that interpresent this field may choose a threshold beyond which to ignore
// mail - A physical mailing address
// notice - A notice regarding this name
// location - A generic location (e.g. "Toronto, Canada")
// phone - A phone number as an E.164 string
// url 