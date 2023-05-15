import { describe, test, expect } from 'vitest';
import { web3nsConfig } from "../../src/web3ns-providers";

describe('web3nsConfig( "prd", "XYZ")', () => {
    const API_KEY = 'XYZ';
    const cfg = web3nsConfig('prd', API_KEY);

    test('avaxApi set', () => {
        expect(cfg.avaxApi).to.equal('https://api.avax.network/ext/bc/C/rpc');
    })

    test('ethApi set', () => {
        expect(cfg.ethApi).to.equal('https://eth-mainnet.alchemyapi.io/v2/' + API_KEY );
    })

    test('lensApi set', () => {
        expect(cfg.polygonApi).to.equal('https://polygon-mainnet.g.alchemy.com/v2/' + API_KEY );
    })

    test('farcasterApi set', () => {
        expect(cfg.farcasterApi).to.equal('https://eth-goerli.g.alchemy.com/v2/' + API_KEY );
    })
})

describe('web3nsConfig( "stg", "ZYX")', () => {
    const API_KEY = 'ZYX';
    const cfg = web3nsConfig('stg', API_KEY);

    test('avaxApi set', () => {
        expect(cfg.avaxApi).to.equal('https://api.avax.network/ext/bc/C/rpc');
    })

    test('ethApi set', () => {
        expect(cfg.ethApi).to.equal('https://eth-goerli.g.alchemy.com/v2/' + API_KEY );
    })

    test('lensApi set', () => {
        expect(cfg.polygonApi).to.equal('https://polygon-mainnet.g.alchemy.com/v2/' + API_KEY );
    })

    test('farcasterApi set', () => {
        expect(cfg.farcasterApi).to.equal('https://eth-goerli.g.alchemy.com/v2/' + API_KEY );
    })
})