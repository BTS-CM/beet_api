import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { compression } from "elysia-compression";

import {
  generateDeepLink,
  accountSearch,
  getBlockedAccounts,
  getFullAccounts,
  fetchOrderBook,
  fetchLimitOrders,
  getAccountBalances,
  getLimitOrders,
  getAccountHistory,
  getPortfolio,
  getObjects,
  getMarketTrades,
  fetchMarkets,
  fetchCreditDeals,
  getFullSmartcoin,
} from "./lib/api";

import {
  getFeeSchedule,
  getAsset,
  getPool,
  getDynamicData,
  getMarketSearch,
  getAllAssets,
  getMinAssets,
  getPools,
  getMinPools,
  getActiveOffers,
  getMinBitassets,
} from "./lib/cache";

import { validResult } from "./lib/common";

//import { swaggerConfig } from "./config/swagger";
import { chains } from "./config/chains";

function publicFile(folder: string, fileName: string, set: any) {
  // Prevent directory traversal attack
  if (fileName.includes("..")) {
    throw new Error("Invalid file");
  }

  const filePath = `./public/${folder}/${fileName}`;
  const file = Bun.file(filePath);

  // Determine content type based on file extension

  const extension = fileName.split(".").pop();
  switch (extension) {
    case "html":
      set.headers["Content-Type"] = "text/html;charset=utf-8";
      break;
    case "css":
      set.headers["Content-Type"] = "text/css;charset=utf-8";
      break;
    case "js":
      set.headers["Content-Type"] = "application/javascript;charset=utf-8";
      break;
    default:
      set.headers["Content-Type"] = "text/plain;charset=utf-8";
  }

  return file;
}

const app = new Elysia()
  //.use(swagger(swaggerConfig))
  .use(staticPlugin({ prefix: "/" }))
  /*
  .use(
    staticPlugin({
      prefix: "/bitshares",
      assets: "./src/data/bitshares",
    })
  )
  .use(
    staticPlugin({
      prefix: "/bitshares_testnet",
      assets: "./src/data/bitshares_testnet",
    })
  )
  */
  .state("bitshares_nodes", JSON.stringify(chains.bitshares.nodeList))
  .state("bitshares_testnet_nodes", JSON.stringify(chains.bitshares_testnet.nodeList))
  .onError(({ code, error }) => {
    return new Response(error.toString());
  })
  .use(
    cors({
      origin: /localhost/,
    })
  )
  .get(
    "/",
    ({ set }) => {
      // Index page which uses staticPlugin resources
      set.headers["Content-Type"] = "text/html;charset=utf-8";
      const _index = Bun.file("./public/index.html");
      return _index;
    },
    {
      detail: {
        summary:
          'Bitshares Pool tool demo web interface. Visit "http://localhost:8080/" in a web browser.',
        tags: ["Website"],
      },
    }
  )
  .get(
    "/index.html",
    ({ set }) => {
      // Index page which uses staticPlugin resources
      set.headers["Content-Type"] = "text/html;charset=utf-8";
      const _index = Bun.file("./public/index.html");
      return _index;
    },
    {
      detail: {
        summary:
          'Bitshares Pool tool demo web interface. Visit "http://localhost:8080/" in a web browser.',
        tags: ["Website"],
      },
    }
  )
  .get(
    "/_astro/:fileName",
    ({ set, params: { fileName } }) => {
      const res = publicFile("_astro", fileName, set);
      return res;
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/borrow/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("borrow", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/deals/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("deals", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/dex/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("dex", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/featured/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("featured", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/ltm/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("ltm", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/offer/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("offer", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/order/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("order", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/pool/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("pool", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/portfolio/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("portfolio", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/settlement/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("settlement", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/smartcoin/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("smartcoin", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/smartcoins/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("smartcoins", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/stake/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("stake", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .get(
    "/transfer/:fileName",
    ({ set, params: { fileName } }) => {
      return publicFile("transfer", fileName, set);
    },
    {
      detail: {
        summary: "bitshares dist files",
        tags: ["Website"],
      },
    }
  )
  .group("/state", (app) =>
    app.get(
      "/currentNodes/:chain",
      ({ store: { bitshares_nodes, bitshares_testnet_nodes }, params: { chain } }) => {
        if (!chain || (chain && chain !== "bitshares" && chain !== "bitshares_testnet")) {
          throw new Error("Invalid chain");
        }

        return JSON.parse(chain === "bitshares" ? bitshares_nodes : bitshares_testnet_nodes);
      },
      {
        detail: {
          summary: "Output the current order of blockchain nodes",
          tags: ["State"],
        },
      }
    )
  )
  .group("/api", (app) =>
    app
      .post(
        "/deeplink/:chain/:opType",
        async ({ body, params: { chain, opType } }) => {
          // Generate a Beet deeplink for all chain operation types
          if (!body || !JSON.parse(body) || !chain || !opType) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          let generatedDeepLink;
          try {
            generatedDeepLink = await generateDeepLink(chain, opType, JSON.parse(body), app);
          } catch (error) {
            throw error;
          }

          return validResult({ generatedDeepLink });
        },
        {
          body: t.String({
            description: "The JSON-encoded request body",
            example: [
              [
                {
                  account: "1.2.1811495",
                  pool: "1.19.0",
                  amount_to_sell: {
                    amount: 100000,
                    asset_id: "1.3.0",
                  },
                  min_to_receive: {
                    amount: 635,
                    asset_id: "1.3.3291",
                  },
                  extensions: [],
                },
              ],
            ],
          }),
          detail: {
            summary: "Generate a deep link",
            tags: ["Beet"],
          },
        }
      )
      .post(
        "/fullSmartcoin/:chain",
        async ({ body, params: { chain } }) => {
          // Retrieve the asset and bitasset data for a single smartcoin
          if (!body || !JSON.parse(body) || !JSON.parse(body).length || !chain) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          const assetID = JSON.parse(body)[0];
          const collateralAssetID = JSON.parse(body)[1];
          const bitassetID = JSON.parse(body)[2];
          const collateralBitassetID = JSON.parse(body)[3];
          const userID = JSON.parse(body)[4];

          let retrievedData;
          try {
            retrievedData = await getFullSmartcoin(
              chain,
              assetID,
              collateralAssetID,
              bitassetID,
              collateralBitassetID,
              userID,
              app
            );
          } catch (error) {
            throw error;
          }

          return validResult(retrievedData);
        },
        {
          body: t.String({
            description: "The JSON-encoded request body",
          }),
          detail: {
            summary: "Retrieve full smartcoin details",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/blockedAccounts/:chain",
        ({ params: { chain } }) => {
          // Return a list of blocked accounts
          if (chain !== "bitshares") {
            throw new Error("Invalid chain");
          }
          return getBlockedAccounts(chain, app);
        },
        {
          detail: {
            summary: "Get a list of blocked accounts",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/fullAccount/:chain/:id",
        async ({ params: { chain, id } }) => {
          // Return full accounts
          if (!chain || !id) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return getFullAccounts(chain, id, app);
        },
        {
          detail: {
            summary: "Get a single account's full details",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/orderBook/:chain/:quote/:base",
        async ({ params: { chain, quote, base } }) => {
          if (!chain || !base || !quote) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return fetchOrderBook(chain, quote, base, app);
        },
        {
          detail: {
            summary: "Get trading pair market orders",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/limitOrders/:chain/:base/:quote",
        async ({ params: { chain, base, quote } }) => {
          if (!chain || !base || !quote) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return fetchLimitOrders(chain, base, quote, app);
        },
        {
          detail: {
            summary: "Get trading pair limit orders",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/accountLookup/:chain/:searchInput",
        async ({ params: { chain, searchInput } }) => {
          // Search for user input account
          if (!chain || !searchInput) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return accountSearch(chain, searchInput, app);
        },
        {
          detail: {
            summary: "Search for blockchain account",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getAccountBalances/:chain/:id",
        async ({ params: { chain, id } }) => {
          // Return account balances
          if (!chain || !id) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return getAccountBalances(chain, id, app);
        },
        {
          detail: {
            summary: "Get an account's balance",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getAccountLimitOrders/:chain/:id",
        async ({ params: { chain, id } }) => {
          // Return account limit orders
          if (!chain || !id) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return getLimitOrders(chain, id, 100, app);
        },
        {
          detail: {
            summary: "Get an account's limit orders",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getAccountHistory/:chain/:id",
        async ({ params: { chain, id } }) => {
          // Return account history
          if (!chain || !id) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return getAccountHistory(chain, id);
        },
        {
          detail: {
            summary: "Get an account's history",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getPortfolio/:chain/:id",
        async ({ params: { chain, id } }) => {
          // Return portfolio data
          if (!chain || !id) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return getPortfolio(chain, id, app);
        },
        {
          detail: {
            summary:
              "Retrieve an account's open orders, balances and recent history in a single query.",
            tags: ["Blockchain"],
          },
        }
      )
      .post(
        "/getObjects/:chain",
        async ({ body, params: { chain } }) => {
          // Fetch multiple objects from the blockchain
          if (!body || !chain) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          const objects = JSON.parse(body);

          let retrievedObjects;
          try {
            retrievedObjects = await getObjects(chain, objects, app);
          } catch (error) {
            throw error;
          }

          if (!retrievedObjects) {
            throw new Error("Objects not found");
          }

          return validResult(retrievedObjects);
        },
        {
          detail: {
            summary: "Get objects",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getMarketHistory/:chain/:quote/:base/:accountID",
        async ({ params: { chain, quote, base, accountID } }) => {
          // Fetch market history
          if (!chain || !base || !quote || !accountID) {
            throw new Error("Missing required fields");
          }

          if (!base.includes("1.3.") || !quote.includes("1.3.")) {
            throw new Error("Invalid asset IDs");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return await getMarketTrades(chain, quote, base, accountID, app);
        },
        {
          detail: {
            summary: "Get market history",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/getFeaturedMarkets/:chain",
        async ({ params: { chain } }) => {
          // Fetch market history
          if (!chain) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          return await fetchMarkets(chain);
        },
        {
          detail: {
            summary: "Get featured markets",
            tags: ["Blockchain"],
          },
        }
      )
      .get(
        "/fetchCreditDeals/:chain/:account",
        async ({ params: { chain, account } }) => {
          // Fetch credit deals
          if (!chain || !account) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          let creditDeals;
          try {
            creditDeals = await fetchCreditDeals(chain, account, app);
          } catch (error) {
            console.log({ error });
            throw error;
          }

          return creditDeals;
        },
        {
          detail: {
            summary: "Get an user's credit deals",
            tags: ["Blockchain"],
          },
        }
      )
  )
  .group("/cache", (app) =>
    app
      .get("/allassets/:chain", async ({ params: { chain } }) => {
        if (chain !== "bitshares" && chain !== "bitshares_testnet") {
          throw new Error("Invalid chain");
        }
        return getAllAssets("both", chain);
      })
      .get("/minAssets/:chain", async ({ params: { chain } }) => {
        if (chain !== "bitshares" && chain !== "bitshares_testnet") {
          throw new Error("Invalid chain");
        }
        return getMinAssets("both", chain);
      })
      .get(
        "/offers/:chain",
        async ({ params: { chain } }) => {
          // Return all offers
          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }
          return getActiveOffers("both", chain);
        },
        {
          detail: {
            summary: "A list of Bitshares offers",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/pools/:chain",
        async ({ params: { chain } }) => {
          // Return entire pool json file
          return getPools("both", chain);
        },
        {
          detail: {
            summary: "A list of Bitshares pools",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/minPools/:chain",
        async ({ params: { chain } }) => {
          // Return the min pool data for this chain
          return getMinPools("both", chain);
        },
        {
          detail: {
            summary: "A list of Bitshares pools",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/bitassets/:chain",
        async ({ params: { chain } }) => {
          // Return the min bitasset data for this chain
          return getMinBitassets("both", chain);
        },
        {
          detail: {
            summary: "A list of Bitshares bitassets",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/feeSchedule/:chain",
        async ({ params: { chain } }) => {
          if (!chain || (chain !== "bitshares" && chain !== "bitshares_testnet")) {
            throw new Error("Missing required fields");
          }

          return getFeeSchedule("both", chain);
        },
        {
          detail: {
            summary: "Data for fee schedule",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/marketSearch/:chain",
        async ({ params: { chain } }) => {
          if (!chain || (chain !== "bitshares" && chain !== "bitshares_testnet")) {
            throw new Error("Missing required fields");
          }

          return getMarketSearch("both", chain);
        },
        {
          detail: {
            summary: "Data for market asset search",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/pool/:chain/:id",
        ({ params: { chain, id } }) => {
          // Return a pool's extended JSON data
          if (!chain || (chain !== "bitshares" && chain !== "bitshares_testnet") || !id) {
            throw new Error("Missing required fields");
          }
          return getPool(chain, id);
        },
        {
          detail: {
            summary: "Retrieve a Bitshares pool",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/dynamic/:chain/:id",
        ({ params: { chain, id } }) => {
          // Return a pool's extended JSON data
          if (!chain || (chain !== "bitshares" && chain !== "bitshares_testnet") || !id) {
            throw new Error("Missing required fields");
          }
          return getDynamicData(chain, id);
        },
        {
          detail: {
            summary: "Retrieve an asset's dynamic data",
            tags: ["Cache"],
          },
        }
      )
      .get(
        "/asset/:chain/:id",
        ({ params: { chain, id } }) => {
          // Return a single asset's JSON data
          if (!chain || (chain !== "bitshares" && chain !== "bitshares_testnet") || !id) {
            throw new Error("Missing required fields");
          }
          const retrievedAsset = getAsset(chain, id);
          if (retrievedAsset) {
            return validResult(retrievedAsset);
          } else {
            throw new Error("Asset not found");
          }
        },
        {
          detail: {
            summary: "Retreive a Bitshares asset",
            tags: ["Cache"],
          },
        }
      )
      .post(
        "/assets/:chain",
        async ({ body, params: { chain } }) => {
          if (!body || Object.keys(body).length === 0 || !chain) {
            throw new Error("Missing required fields");
          }

          if (chain !== "bitshares" && chain !== "bitshares_testnet") {
            throw new Error("Invalid chain");
          }

          const assetIDs = typeof body === "object" ? Object.values(body) : JSON.parse(body);
          const assets = [];
          for (let i = 0; i < assetIDs.length; i++) {
            const asset = getAsset(chain, assetIDs[i]);
            if (asset) {
              assets.push(asset);
            }
          }

          return validResult(assets);
        },
        {
          detail: {
            summary: "Retrieve multiple Bitshares assets",
            tags: ["Cache"],
          },
        }
      )
  )
  .use(compression())
  .listen(8080);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} `);
