import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'

import {
  generateDeepLink,
  accountSearch,
  getBlockedAccounts,
  getFullAccounts,
  fetchOrderBook,
  getAccountBalances,
  getLimitOrders,
  getAccountHistory,
  getPortfolio
} from './lib/api';

import { getAsset, getPool, getDynamicData } from './lib/cache';
import { validResult } from './lib/common';

import { swaggerConfig } from './config/swagger';
import { chains } from "./config/chains";

const app = new Elysia()
.state('bitshares_nodes', JSON.stringify(chains.bitshares.nodeList))
.state('bitshares_testnet_nodes', JSON.stringify(chains.bitshares_testnet.nodeList))
.use(staticPlugin({
    prefix: '/',
  }))
  .use(swagger(swaggerConfig))
  .onError(({ code, error }) => {
    return new Response(error.toString())
  })
  .use(cors()) // for local astro development purposes only!
  .get("/", () => {
    // Index page which uses staticPlugin resources
    return Bun.file('./public/index.html')
  }, {
    detail: {
      summary: 'Bitshares Pool tool demo web interface. Visit "http://localhost:8080/" in a web browser.',
      tags: ['Website']
    }
  })
  .group('/state', app => app
    .get('/currentNodes/:chain', ({ store: { bitshares_nodes, bitshares_testnet_nodes }, params: { chain } }) => {
      if (!chain || chain && chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return JSON.parse(chain === 'bitshares' ? bitshares_nodes: bitshares_testnet_nodes);
    }, {
      detail: {
        summary: 'Output the current order of blockchain nodes',
        tags: ['State']
      }
    })
  )
  .group('/cache', app => app
    .get('/poolAssets/:chain', ({ params: { chain } }) => {
      // Return all pool assets from file
      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }
      return Bun.file(`./src/data/${chain}/poolAssets.json`)
    }, {
      detail: {
        summary: 'A list of Bitshares assets',
        tags: ['Cache']
      }
    })
    .get('/pools/:chain', ({ params: { chain } }) => {
      // Return entire pool json file
      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }
      return Bun.file(`./src/data/${chain}/pools.json`)
    }, {
      detail: {
        summary: 'A list of Bitshares pools', tags: ['Cache']
      }
    })
    .get('/pool/:chain/:id', ({ params: { chain, id } }) => {
      // Return a pool's extended JSON data
      if (
        !chain ||
        (chain !== "bitshares" && chain !== 'bitshares_testnet') ||
        !id
      ) {
        throw new Error("Missing required fields");
      }
      return getPool(chain, id)
    }, {
      detail: {
        summary: 'Retrieve a Bitshares pool', tags: ['Cache']
      }
    })
    .get('/dynamic/:chain/:id', ({ params: { chain, id } }) => {
      // Return a pool's extended JSON data
      if (
        !chain ||
        (chain !== "bitshares" && chain !== 'bitshares_testnet') ||
        !id
      ) {
        throw new Error("Missing required fields");
      }
      return getDynamicData(chain, id)
    }, {
      detail: {
        summary: "Retrieve an asset's dynamic data", tags: ['Cache']
      }
    })
    .get('/asset/:chain/:id', ({ params: { chain, id } }) => {
      // Return a single asset's JSON data
      if (
        !chain ||
        (chain !== "bitshares" && chain !== 'bitshares_testnet') ||
        !id
      ) {
        throw new Error("Missing required fields");
      }
      return getAsset(chain, id)
    }, {
      detail: {
        summary: 'Retreive a Bitshares asset', tags: ['Cache']
      }
    })
    .post('/assets/:chain', async ({ body, params: { chain } }) => {
      if (!body || !JSON.parse(body) || (!chain)) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      const assetIDs = JSON.parse(body);
      const assets = [];
      for (let i = 0; i < assetIDs.length; i++) {
        const asset = getAsset(chain, assetIDs[i]);
        if (asset) {
          assets.push(asset);
        }
      }

      return validResult(assets);
    }, {
      detail: {
        summary: 'Retrieve multiple Bitshares assets', tags: ['Cache']
      }
    })
  )
  .group('/api', app => app
    .post('/deeplink/:chain/:opType', async ({ body, params: { chain, opType } }) => {
      // Generate a Beet deeplink for all chain operation types
      if (!body || !JSON.parse(body) || (!chain || !opType)) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }
    
      let generatedDeepLink;
      try {
        generatedDeepLink = await generateDeepLink(chain, opType, JSON.parse(body), app);
      } catch (error) {
        throw error;
      }

      return validResult({generatedDeepLink});
    }, {
      body: t.String({
        description: 'The JSON-encoded request body',
        example: [
          [
            {
              account: "1.2.1811495",
              pool: "1.19.0",
              amount_to_sell: {
                amount: 100000,
                asset_id: "1.3.0"
              },
              min_to_receive: {
                amount: 635,
                asset_id: "1.3.3291"
              },
              extensions: []
            }
          ]
        ]
      }),
      detail: {
        summary: 'Generate a deep link',
        tags: ['Beet']
      }
    })
    .get('/blockedAccounts/:chain', ({ params: { chain } }) => {
      // Return a list of blocked accounts
      if (chain !== 'bitshares') {
        throw new Error("Invalid chain");
      }
      return getBlockedAccounts(chain, app);
    }, {
      detail: {
        summary: 'Get a list of blocked accounts',
        tags: ['Blockchain']
      }
    })
    .get('/fullAccount/:chain/:id', async ({ params: { chain, id } }) => {
      // Return full accounts
      if (!chain || !id) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return getFullAccounts(chain, id, app);
    }, {
      detail: {
        summary: "Get a single account's full details",
        tags: ['Blockchain']
      }
    })
    .get('/orderBook/:chain/:base/:quote', async ({ params: { chain, base, quote } }) => {
      if (!chain || !base || !quote) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return fetchOrderBook(chain, base, quote, app);
    }, {
      detail: {
        summary: 'Get trading pair market orders',
        tags: ['Blockchain']
      }
    })
    .get('/accountLookup/:chain/:searchInput', async ({ params: { chain, searchInput } }) => {
      // Search for user input account
      if (!chain || !searchInput) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return accountSearch(chain, searchInput, app);
    }, {
      detail: {
        summary: 'Search for blockchain account',
        tags: ['Blockchain']
      }
    })
    .get('/getAccountBalances/:chain/:id', async ({ params: { chain, id } }) => {
      // Return account balances
      if (!chain || !id) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return getAccountBalances(chain, id, app);
    }, {
      detail: {
        summary: "Get an account's balance",
        tags: ['Blockchain']
      }
    })
    .get('/getAccountLimitOrders/:chain/:id', async ({ params: { chain, id } }) => {
      // Return account limit orders
      if (!chain || !id) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }

      return getLimitOrders(
        chain,
        id,
        100,
        app
      );
    }, {
      detail: {
        summary: "Get an account's limit orders",
        tags: ['Blockchain']
      }
    })
    .get('/getAccountHistory/:chain/:id', async ({ params: { chain, id } }) => {
      // Return account history
      if (!chain || !id) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }
      
      return getAccountHistory(chain, id);
    }, {
      detail: {
        summary: "Get an account's history",
        tags: ['Blockchain']
      }
    })
    .get('/getPortfolio/:chain/:id', async ({ params: { chain, id } }) => {
      // Return portfolio data
      if (!chain || !id) {
        throw new Error("Missing required fields");
      }

      if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
        throw new Error("Invalid chain");
      }
      
      return getPortfolio(chain, id, app);
    }, {
      detail: {
        summary: "Retrieve an account's open orders, balances and recent history in a single query.",
        tags: ['Blockchain']
      }
    })
  )
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} `
);
