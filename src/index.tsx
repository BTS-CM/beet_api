import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'

import { generateDeepLink } from './lib/api';
import { getAsset, getPool } from './lib/cache';
import { validResult } from './lib/common';

import { swaggerConfig } from './config/swagger';

const app = new Elysia()
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
                    tags: ['Bitshares']
                  }
                })
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
                      tags: ['Bitshares']
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
                      summary: 'A list of Bitshares pools', tags: ['Bitshares']
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
                      summary: 'Retrieve a Bitshares pool', tags: ['Bitshares']
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
                      summary: 'Retreive a Bitshares asset', tags: ['Bitshares']
                    }
                  })
                )
                .post('/beet/:chain/:opType', async ({ body, params: { chain, opType } }) => {
                  // Generate a Beet deeplink for all chain operation types
                  if (!body || !JSON.parse(body) || (!chain || !opType)) {
                    throw new Error("Missing required fields");
                  }
                
                  let generatedDeepLink;
                  try {
                    generatedDeepLink = await generateDeepLink(chain, opType, JSON.parse(body));
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
                .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} `
);
