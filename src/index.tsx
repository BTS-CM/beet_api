import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
//import { cors } from '@elysiajs/cors'

import { generateDeepLink } from './lib';

import allPools from "./data/allPools.json";
import assetData from "./data/assetData.json";

function getAsset(id: string) {
  const foundAsset = assetData.find((asset: any) => asset.id === id);
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

function getPool(id: string) {
  const foundPool = allPools.find((pool: any) => pool.id === id);
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
                .get('/assets', () => {
                  return Bun.file('./src/data/assetData.json')
                }, {
                  detail: {
                    summary: 'A list of Bitshares assets',
                    tags: ['Bitshares']
                  }
                })
                .get('/pools', () => {
                  return Bun.file('./src/data/pools.json')
                }, {
                  detail: {
                    summary: 'A list of Bitshares pools',
                    tags: ['Bitshares']
                  }
                })
                // astro built files
                .get('/_astro/Form.3f0ea395.js', () => Bun.file('./src/view/_astro/Form.3f0ea395.js'))
                .get('/_astro/index.6460afdd.js', () => Bun.file('./src/view/_astro/index.6460afdd.js'))
                .get('/_astro/client.a461b027.js', () => Bun.file('./src/view/_astro/client.a461b027.js'))
                // end of astro files
                .group('/api', app => app
                  .get('/asset/:id', ({ params: { id } }) => {
                    return getAsset(id)
                  }, {
                    detail: {
                      summary: 'Retreive a Bitshares asset',
                      tags: ['Bitshares']
                    }
                  })
                  .get('/pool/:id', ({ params: { id } }) => {
                   return getPool(id)
                  }, {
                    detail: {
                      summary: 'Retrieve a Bitshares pool',
                      tags: ['Bitshares']
                    }
                  })
                )
                .post('/beet', async ({ body }) => {
                  if (!body || !JSON.parse(body)) {
                    throw new Error("Missing required fields");
                  }
                
                  let generatedDeepLink;
                  try {
                    generatedDeepLink = await generateDeepLink(JSON.parse(body));
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
