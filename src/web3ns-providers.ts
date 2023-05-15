import { mainnet, polygon, avalanche, hardhat } from 'viem/chains';

export interface web3nsConfig {
    ethChain: any;
    ethApi: string;
    polygonChain: any;
    polygonApi: string;
    avaxChain: any;
    avaxApi: string;
    farcasterChain: any;
    farcasterApi: string;
    threeNumContract: string;
    lensContract: string;
    farcasterNameContract: string;
    farcasterIdContract: string;
  }

// Providers

const ALCHEMY_ETH_MAINNET_URL     = 'https://eth-mainnet.alchemyapi.io/v2/';
const ALCHEMY_POLYGON_MAINNET_URL = 'https://polygon-mainnet.g.alchemy.com/v2/';
const ALCHEMY_ETH_GOERLI_URL      = 'https://eth-goerli.g.alchemy.com/v2/';
const AVAX_MAINNET_URL            = 'https://api.avax.network/ext/bc/C/rpc'

// Contracts

const THREE_NUM_CONTRACT_ADDRESS = '0x385137A9f5a298cC620471b1CFf4F4c070afF4b9';

const LENS_LLP_CONTRACT_ADDRESS  = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';

const FARCASTER_NAME_CONTRACT_ADDRESS = '0xe3be01d99baa8db9905b33a3ca391238234b79d1';
const FARCASTER_ID_CONTRACT_ADDRESS   = '0xDA107A1CAf36d198B12c16c7B6a1d1C795978C42';

export const web3nsConfig = (env: string, apiKey: string): web3nsConfig => {
    switch (env) {
        case 'stg':
            return {
                ethChain: mainnet,
                ethApi: ALCHEMY_ETH_GOERLI_URL + apiKey,
                polygonChain: polygon,
                polygonApi: ALCHEMY_POLYGON_MAINNET_URL + apiKey,
                avaxChain: avalanche, // Currently unused by AVVY lib
                avaxApi: AVAX_MAINNET_URL, // Doesn't use apiKey
                farcasterChain: hardhat,
                farcasterApi: ALCHEMY_ETH_GOERLI_URL + apiKey, // Prod Farcaster is on Goerli now
                threeNumContract: THREE_NUM_CONTRACT_ADDRESS,
                lensContract: LENS_LLP_CONTRACT_ADDRESS,
                farcasterNameContract: FARCASTER_NAME_CONTRACT_ADDRESS,
                farcasterIdContract: FARCASTER_ID_CONTRACT_ADDRESS        
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
        farcasterChain: hardhat,
        farcasterApi: ALCHEMY_ETH_GOERLI_URL + apiKey, // Prod Farcaster is on Goerli now
        threeNumContract: THREE_NUM_CONTRACT_ADDRESS,
        lensContract: LENS_LLP_CONTRACT_ADDRESS,
        farcasterNameContract: FARCASTER_NAME_CONTRACT_ADDRESS,
        farcasterIdContract: FARCASTER_ID_CONTRACT_ADDRESS        
}
}