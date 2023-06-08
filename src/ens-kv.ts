import { Address, zeroAddress, keccak256, encodePacked } from 'viem';
import { Web3nsError, Web3nsNotFoundError } from './models/web3ns-errors';
import { web3nsConfig } from './web3ns-providers';
import { createPublicClient, http, parseAbi } from 'viem';

export interface NameData {
  owner: Address;
  addresses?: { [coinType: number]: Address };
  text?: { [key: string]: string };
  contenthash?: `0x${string}`;
}

export async function queryName(
  cfg: web3nsConfig,
  name: string
): Promise<NameData | null> {
  //return ensDb.get(name, { type: 'json' });
  const client = createPublicClient({
    chain: cfg.ethChain,
    transport: http(cfg.ethApi),
  });

  // Parse the name to get the number, trimming off the leading + sign
  const number = BigInt(name.split('.')[0]);

  const abi = parseAbi([
    'function ownerOf(uint256 tokenId) public view returns (address)',
  ]);

  //
  // The ENUM.sol contract code is:
  // function e164uintToTokenId(
  //     uint56 _number
  // ) public pure returns (uint256 tokenId) {
  //     return uint256(keccak256(abi.encodePacked(_number)));
  // }

  const tokenId = BigInt(keccak256(encodePacked(['uint56'], [number])));

  let address: Address = zeroAddress;

  try {
    address = await client.readContract({
      address: cfg.threeNumContract,
      abi: abi,
      functionName: 'ownerOf',
      args: [tokenId],
    });
  } catch {}

  return {
    owner: address,
    addresses: {
      60: address,
    },
  };
}

// namespace.put( name,
//     JSON.stringify(lookupData),
//     { expirationTtl: ExperationTTL }
//   );
