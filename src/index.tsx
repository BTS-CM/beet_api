import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
//import { cors } from '@elysiajs/cors'

import { generateDeepLink } from './lib';

import bts_allPools from "./data/bitshares/allPools.json";
import bts_allAssets from "./data/bitshares/allAssets.json";

import test_allPools from "./data/bitshares_testnet/allPools.json";
import test_allAssets from "./data/bitshares_testnet/allAssets.json";

function getAsset(chain: string, id: string) {
  let foundAsset;
  if (chain === "bitshares") {
    foundAsset = bts_allAssets.find((asset: any) => asset.id === id);
  } else if (chain === "bitshares_testnet") {
    foundAsset = test_allAssets.find((asset: any) => asset.id === id);
  }

  if (!foundAsset) {
    throw new Error("Asset not found");
  }

  return new Response(
    JSON.stringify({
      message: "Success!",
      foundAsset
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

function getPool(chain: string, id: string) {
  let foundPool;
  if (chain === "bitshares") {
    foundPool = bts_allPools.find((asset: any) => asset.id === id);
  } else if (chain === "bitshares_testnet") {
    foundPool = test_allPools.find((asset: any) => asset.id === id);
  }

  if (!foundPool) {
    throw new Error("Pool not found");
  }

  return new Response(
    JSON.stringify({
      message: "Success!",
      foundPool
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

const app = new Elysia()
                .use(swagger({
                  documentation: {
                      info: {
                          title: 'Bitshares BEET API Swagger documentation',
                          version: '0.0.1',
                          description: 'A Swagger API for the Bitshares BEET API. This API is for local use only.',
                          license: {
                            name: 'MIT licensed code',
                            url: 'https://opensource.org/licenses/MIT'
                          },
                          contact: {
                            name: "Github repository",
                            url: "https://github.com/BTS-CM/beet_api"
                          }
                      },
                      tags: [
                        { name: 'Beet', description: 'BEET deeplink endpoints' },
                        { name: 'Bitshares', description: 'Bitshares data' },
                      ],
                      externalDocs: {
                        description: 'Find out more about the Bitshares BEET multiwallet',
                        url: 'https://github.com/bitshares/beet'
                      }
                  }
                }))
                .onError(({ code, error }) => {
                  return new Response(error.toString())
                })
                //.use(cors()) // for local astro development purposes only!
                .get("/", () => {
                  return Bun.file('./src/view/index.html')
                }, {
                  detail: {
                    summary: 'Bitshares Pool tool demo web interface. Visit "http://localhost:8080/" in a web browser.',
                    tags: ['Bitshares']
                  }
                })
                .get('/assets/:chain', ({ params: { chain } }) => {
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
                  if (chain !== 'bitshares' && chain !== 'bitshares_testnet') {
                    throw new Error("Invalid chain");
                  }
                  return Bun.file(`./src/data/${chain}/pools.json`)
                }, {
                  detail: {
                    summary: 'A list of Bitshares pools',
                    tags: ['Bitshares']
                  }
                })
                // astro built files
                .get('/_astro/Form.4acbcf50.js', () => Bun.file('./src/view/_astro/Form.4acbcf50.js'))
                .get('/_astro/index.6460afdd.js', () => Bun.file('./src/view/_astro/index.6460afdd.js'))
                .get('/_astro/client.a461b027.js', () => Bun.file('./src/view/_astro/client.a461b027.js'))
                // end of astro files
                .group('/api', app => app
                  .get('/asset/:chain/:id', ({ params: { chain, id } }) => {
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
                      summary: 'Retreive a Bitshares asset',
                      tags: ['Bitshares']
                    }
                  })
                  .get('/pool/:chain/:id', ({ params: { chain, id } }) => {
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
                      summary: 'Retrieve a Bitshares pool',
                      tags: ['Bitshares']
                    }
                  })
                )
                .post(
                  '/beet/:chain/:opType',
                  async ({ body, params: { chain, opType } }) => {
                    if (!body || !JSON.parse(body) || (!chain || !opType)) {
                      throw new Error("Missing required fields");
                    }
                  
                    let generatedDeepLink;
                    try {
                      generatedDeepLink = await generateDeepLink(chain, opType, JSON.parse(body));
                    } catch (error) {
                      throw error;
                    }
                
                    return new Response(
                      JSON.stringify({
                        message: "Success!",
                        generatedDeepLink
                      }),
                      {
                        status: 200,
                        headers: {
                          "Content-Type": "application/json"
                        }
                      }
                    );
                  }, {
                    body: t.String({
                      description: 'The JSON-encoded request body',
                      example: [
                        [
                          "",
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
