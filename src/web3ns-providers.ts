import type { Address } from 'viem';
import { mainnet, polygon, avalanche, hardhat, goerli } from 'viem/chains';

export interface Env {
    // Binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    names: KVNamespace;
    addresses: KVNamespace;
    ensDb: KVNamespace;
  
    ALCHEMY_API_KEY: string;
    
    ENVIRONMENT: string;
  }
  
export interface web3nsConfig {
    ethChain: any;
    ethApi: string;
    polygonChain: any;
    polygonApi: string;
    avaxChain: any;
    avaxApi: string;
    avaxContract: Address;
    farcasterChain: any;
    farcasterApi: string;
    threeNumContract: Address;
    lensContract: Address;
    farcasterNameContract: Address;
    farcasterIdContract: Address;
    e164ResolverContract: Address;
    threeNumEnsContract: Address;
  }

// Providers

const ALCHEMY_ETH_MAINNET_URL     = 'https://eth-mainnet.alchemyapi.io/v2/';
const ALCHEMY_POLYGON_MAINNET_URL = 'https://polygon-mainnet.g.alchemy.com/v2/';
const ALCHEMY_ETH_GOERLI_URL      = 'https://eth-goerli.g.alchemy.com/v2/';
const AVAX_MAINNET_URL            = 'https://api.avax.network/ext/bc/C/rpc'

// Contracts

const LENS_LLP_CONTRACT_ADDRESS  = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';

const FARCASTER_NAME_CONTRACT_ADDRESS = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
const FARCASTER_ID_CONTRACT_ADDRESS   = '0xDA107A1CAf36d198B12c16c7B6a1d1C795978C42';

const AVAX_NAME_CONTRACT_ADDRESS = '0x1ea4e7A798557001b99D88D6b4ba7F7fc79406A9';
// E164 Resolver
const E164_RESOLVER_CONTRACT_ADDRESS = '0xC5273AbFb36550090095B1EDec019216AD21BE6c';

export const web3nsConfig = (env: string, apiKey: string): web3nsConfig => {
    switch (env) {
        case 'stg':
            return {
                ethChain: goerli,
                ethApi: ALCHEMY_ETH_GOERLI_URL + apiKey,
                polygonChain: polygon,
                polygonApi: ALCHEMY_POLYGON_MAINNET_URL + apiKey,
                avaxChain: avalanche, // Currently unused by AVVY lib
                avaxApi: AVAX_MAINNET_URL, // Doesn't use apiKey
                avaxContract: AVAX_NAME_CONTRACT_ADDRESS,
                farcasterChain: hardhat,
                farcasterApi: ALCHEMY_ETH_GOERLI_URL + apiKey, // Prod Farcaster is on Goerli now
                threeNumContract: '0x6C48247D280382491A94983470D01f428F29C69b',
                lensContract: LENS_LLP_CONTRACT_ADDRESS,
                farcasterNameContract: FARCASTER_NAME_CONTRACT_ADDRESS,
                farcasterIdContract: FARCASTER_ID_CONTRACT_ADDRESS,
                e164ResolverContract: E164_RESOLVER_CONTRACT_ADDRESS,
                threeNumEnsContract: '0xC5273AbFb36550090095B1EDec019216AD21BE6c'
            };
    }

    // Production config is default env
    return {
        ethChain: mainnet,
        ethApi: ALCHEMY_ETH_MAINNET_URL + apiKey,
        polygonChain: polygon,
        polygonApi: ALCHEMY_POLYGON_MAINNET_URL + apiKey,
        avaxChain: avalanche, // Currently unused by AVVY lib
        avaxApi: AVAX_MAINNET_URL, // Doesn't use apiKey
        avaxContract: AVAX_NAME_CONTRACT_ADDRESS,
        farcasterChain: hardhat,
        farcasterApi: ALCHEMY_ETH_GOERLI_URL + apiKey, // Prod Farcaster is on Goerli now
        threeNumContract: '0x385137A9f5a298cC620471b1CFf4F4c070afF4b9',
        lensContract: LENS_LLP_CONTRACT_ADDRESS,
        farcasterNameContract: FARCASTER_NAME_CONTRACT_ADDRESS,
        farcasterIdContract: FARCASTER_ID_CONTRACT_ADDRESS,
        e164ResolverContract: E164_RESOLVER_CONTRACT_ADDRESS,
        threeNumEnsContract: '0xC5273AbFb36550090095B1EDec019216AD21BE6c'
    }
}
