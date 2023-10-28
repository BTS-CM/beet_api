import { v4 as uuidv4 } from "uuid";
import { Apis, TransactionBuilder } from "bts-buntime";

import { chains } from "../config/chains";

import { changeURL, getCurrentNode } from "./states";
import { validResult } from "./common";

/**
 * Returns deeplink contents
 * @param chain
 * @param opType
 * @param operations
 * @param app
 * @returns generated deeplink
 */
async function generateDeepLink(
  chain: String,
  opType: String,
  operations: Array<Object>,
  app: any
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        10000,
        { enableDatabase: true, enableCrypto: false, enableOrders: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    const tr = new TransactionBuilder();
    for (let i = 0; i < operations.length; i++) {
      tr.add_type_operation(opType, operations[i]);
    }

    try {
      await tr.update_head_block(currentAPI);
    } catch (error) {
      console.error(error);
      currentAPI.close();
      reject(error);
      return;
    }

    try {
      await tr.set_required_fees(null, null, currentAPI);
    } catch (error) {
      console.error(error);
      currentAPI.close();
      reject(error);
      return;
    }

    try {
      tr.set_expire_seconds(7200);
    } catch (error) {
      console.error(error);
      currentAPI.close();
      reject(error);
      return;
    }

    try {
      tr.finalize(currentAPI);
    } catch (error) {
      console.error(error);
      currentAPI.close();
      reject(error);
      return;
    }

    const request = {
      type: "api",
      id: await uuidv4(),
      payload: {
        method: "injectedCall",
        params: ["signAndBroadcast", JSON.stringify(tr.toObject()), []],
        appName: "Static Bitshares Astro web app",
        chain: chain === "bitshares" ? "BTS" : "TEST",
        browser: "web browser",
        origin: "localhost",
      },
    };

    currentAPI.close();

    let encodedPayload;
    try {
      encodedPayload = encodeURIComponent(JSON.stringify(request));
    } catch (error) {
      console.log(error);
      reject(error);
      return;
    }

    resolve(encodedPayload);
  });
}

/**
 * Split an array into array chunks
 * @param arr
 * @param size
 * @returns {Array} [[{..}, ...], ...]
 */
function _sliceIntoChunks(arr: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Get multiple objects such as accounts, assets, etc
 * @param chain
 * @param object_ids
 * @param app
 * @returns Array of retrieved objects
 */
async function getObjects(chain: String, object_ids: Array<String>, app?: any) {
  return new Promise(async (resolve, reject) => {
    let node;
    if (!app) {
      const nodeList = chains[chain].nodeList;
      const randomNode = nodeList[Math.floor(Math.random() * nodeList.length)];
      node = randomNode.url;
    } else {
      node = getCurrentNode(chain, app);
    }

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log({ error, msg: "instance failed" });
      if (app) {
        changeURL(chain, app);
      }
      reject(error);
      return;
    }

    let retrievedObjects: Object[] = [];
    const chunksOfInputs = _sliceIntoChunks(object_ids, 50);
    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      let got_objects;
      try {
        got_objects = await currentAPI
          .db_api()
          .exec("get_objects", [currentChunk, false]);
      } catch (error) {
        console.log(error);
        continue;
      }

      if (got_objects && got_objects.length) {
        retrievedObjects = retrievedObjects.concat(
          got_objects.filter((x) => x !== null)
        );
      }
    }

    currentAPI.close();

    if (retrievedObjects && retrievedObjects.length) {
      resolve(retrievedObjects);
      return;
    }

    reject(new Error("Couldn't retrieve objects"));
  });
}

/*
 * Fetch account/address list to warn users about
 * List is maintained by the Bitshares committee
 * @param chain
 * @param app
 * @returns committee account details containing block list
 */
async function getBlockedAccounts(chain: String, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    if (!currentAPI.db_api()) {
      console.log("no db_api");
      currentAPI.close();
      reject(new Error("no db_api"));
      return;
    }

    let object;
    try {
      object = await currentAPI
        .db_api()
        .exec("get_accounts", [["committee-blacklist-manager"]]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    currentAPI.close();

    if (!object) {
      reject(new Error("Committee account details not found"));
      return;
    }

    resolve(validResult(object));
  });
}

/**
 * Search for an account, given 1.2.x or an account name.
 * @param chain
 * @param search_string
 * @returns
 */
async function accountSearch(chain: String, search_string: String, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    let object;
    try {
      object = await currentAPI
        .db_api()
        .exec("get_accounts", [[search_string]]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    if (!object || !object.length) {
      return reject(new Error("Couldn't retrieve account"));
    }

    currentAPI.close();
    resolve(validResult(object[0]));
  });
}

/*
 * Fetch account/address list to warn users about
 * List is maintained by the Bitshares committee
 */
async function getFullAccounts(chain: String, accountID: String, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    let object;
    try {
      object = await currentAPI
        .db_api()
        .exec("get_full_accounts", [[accountID], false])
        .then((results: Object[]) => {
          if (results && results.length) {
            return results;
          }
        });
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    currentAPI.close();

    if (!object) {
      reject(new Error("Committee account details not found"));
      return;
    }

    resolve(validResult(object));
  });
}

/**
 * Fetch account history from external elasticsearch server
 * @param chain
 * @param accountID
 * @param app
 * @param from (optional) from which index to fetch
 * @param size (optional) how many items to fetch
 * @param from_date (optional) from which date to fetch
 * @param to_date (optional) to which date to fetch
 * @param sort_by (optional) sort by which field
 * @param type (optional) type of data to fetch
 * @param agg_field (optional) aggregate field
 *
 * @returns Resposne containing account history
 */
async function getAccountHistory(
  chain: String,
  accountID: String,
  from?: Number,
  size?: Number,
  from_date?: String,
  to_date?: String,
  sort_by?: String,
  type?: String,
  agg_field?: String
) {
  return new Promise(async (resolve, reject) => {
    const url =
      `https://${
        chain === "bitshares" ? "api" : "api.testnet"
      }.bitshares.ws/openexplorer/es/account_history` +
      `?account_id=${accountID}` +
      `&from_=${from ?? 0}` +
      `&size=${size ?? 100}` +
      `&from_date=${from_date ?? "2015-10-10"}` +
      `&to_date=${to_date ?? "now"}` +
      `&sort_by=${sort_by ?? "-operation_id_num"}` +
      `&type=${type ?? "data"}` +
      `&agg_field=${agg_field ?? "operation_type"}`;

    let history;
    try {
      history = await fetch(url, { method: "GET" });
    } catch (error) {
      console.log(error);
      reject(error);
    }

    if (!history || !history.ok) {
      console.log({
        error: new Error(
          history
            ? `${history.status} ${history.statusText}`
            : "Couldn't fetch account history"
        ),
        msg: "Couldn't fetch account history.",
      });
      return;
    }

    const historyJSON = await history.json();

    if (!historyJSON) {
      reject(new Error("Account history not found"));
      return;
    }

    resolve(validResult(historyJSON));
  });
}

/**
 * Fetch account balances
 * @param chain
 * @param accountID
 * @param app
 * @returns Resposne containing account balances
 */
async function getAccountBalances(chain: String, accountID: String, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    let balances;
    try {
      balances = await currentAPI
        .db_api()
        .exec("get_account_balances", [accountID, []])
        .then((results: Object[]) => {
          if (results && results.length) {
            return results;
          }
        });
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    currentAPI.close();

    if (!balances) {
      reject(new Error("Account balances not found"));
      return;
    }

    resolve(validResult(balances));
  });
}

/**
 * Fetch account's limit orders
 * @param chain
 * @param accountID
 * @param limit
 * @param app
 * @param lastID (optional last ID to fetch from)
 * @returns Resposne containing account balances
 */
async function getLimitOrders(
  chain: String,
  accountID: String,
  limit: Number,
  app: any,
  lastID?: String
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      reject(error);
      return;
    }

    let limitOrders;
    try {
      limitOrders = await currentAPI
        .db_api()
        .exec("get_limit_orders_by_account", [accountID, limit])
        .then((results: Object[]) => {
          if (results && results.length) {
            return results;
          }
        });
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    currentAPI.close();

    if (!limitOrders) {
      reject(new Error("Account balances not found"));
      return;
    }

    resolve(validResult(limitOrders));
  });
}

/**
 * Fetch the orderbook for a given market
 * @param chain
 * @param base
 * @param quote
 * @param app
 * @returns market orderbook contents
 */
async function fetchOrderBook(
  chain: String,
  quote: String,
  base: String,
  app: any
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      return reject(error);
    }

    let orderBook;
    try {
      orderBook = await currentAPI
        .db_api()
        .exec("get_order_book", [base, quote, 50]);
    } catch (error) {
      console.log(error);
    }

    try {
      await currentAPI.close();
    } catch (error) {
      console.log(error);
    }

    if (!orderBook) {
      return reject(new Error("Couldn't retrieve orderbook"));
    }

    resolve(validResult(orderBook));
  });
}

/**
 * Fetching the top markets from elasticsearch
 * @param chain
 * @returns object containing top markets
 */
async function fetchMarkets(chain: string) {
  return new Promise(async (resolve, reject) => {
    const retrievedData = await fetch(
      chain === "bitshares"
        ? `https://api.bitshares.ws/openexplorer/top_markets?top_n=100`
        : `https://api.testnet.bitshares.ws/openexplorer/top_markets?top_n=50`
    );

    if (!retrievedData || !retrievedData.ok) {
      reject(new Error("Couldn't fetch top markets"));
      return;
    }

    const topMarkets = await retrievedData.json();

    if (!topMarkets) {
      reject(new Error("Top markets not found"));
      return;
    }

    resolve(validResult(topMarkets));
  });
}

/**
 * Fetch the credit deals for borrowers and owners
 * @param chain
 * @param account_name_or_id
 * @param app
 * @returns market limit orders contents
 */
async function fetchCreditDeals(
  chain: String,
  account_name_or_id: String,
  app: any
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      return reject(error);
    }

    let borrowerDeals;
    try {
      borrowerDeals = await currentAPI
        .db_api()
        .exec("get_credit_deals_by_borrower", [account_name_or_id]);
    } catch (error) {
      console.log(error);
      return reject(error);
    }

    let ownerDeals;
    try {
      ownerDeals = await currentAPI
        .db_api()
        .exec("get_credit_deals_by_offer_owner", [account_name_or_id]);
    } catch (error) {
      console.log(error);
      return reject(error);
    }

    try {
      currentAPI.close();
    } catch (error) {
      console.log(error);
    }

    if (!borrowerDeals || !ownerDeals) {
      return reject(new Error("Couldn't retrieve credit deals"));
    }

    return resolve(
      validResult({
        borrowerDeals,
        ownerDeals,
      })
    );
  });
}

/**
 * Fetch the limit orders for a given market
 * @param chain
 * @param base
 * @param quote
 * @param app
 * @returns market limit orders contents
 */
async function fetchLimitOrders(
  chain: String,
  base: String,
  quote: String,
  app: any
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      return reject(error);
    }

    let limitOrders;
    try {
      limitOrders = currentAPI
        .db_api()
        .exec("get_limit_orders", [base, quote, 50]);
    } catch (error) {
      console.log(error);
    }

    try {
      currentAPI.close();
    } catch (error) {
      console.log(error);
    }

    if (!limitOrders) {
      return reject(new Error("Couldn't retrieve limit orders"));
    }

    resolve(validResult(limitOrders));
  });
}

/**
 * Fetches: Account balances, limit orders and activity
 * @param chain
 * @param accountID
 * @param historyOptions
 * @param app
 */
async function getPortfolio(chain: String, accountID: String, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      return reject(error);
    }

    let limitOrders;
    try {
      limitOrders = await currentAPI
        .db_api()
        .exec("get_limit_orders_by_account", [accountID, 100]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    let balances;
    try {
      balances = await currentAPI
        .db_api()
        .exec("get_account_balances", [accountID, []]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    try {
      currentAPI.close();
    } catch (error) {
      console.log(error);
    }

    if (!balances) {
      reject(new Error("Account balances not found"));
      return;
    }

    if (!limitOrders) {
      reject(new Error("Account limit orders not found"));
      return;
    }

    resolve(
      validResult({
        balances,
        limitOrders,
      })
    );
  });
}

/**
 * Fetches: Market pair's recent trades, user's recent trades, user's open orders
 * @param chain
 * @param quote
 * @param base
 * @param accountID
 * @param app
 */
async function getMarketTrades(
  chain: String,
  quote: String,
  base: String,
  accountID: String,
  app: any
) {
  return new Promise(async (resolve, reject) => {
    const node = getCurrentNode(chain, app);

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true, enableHistory: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log(error);
      changeURL(chain, app);
      return reject(error);
    }

    let balances;
    try {
      balances = await currentAPI
        .db_api()
        .exec("get_account_balances", [accountID, [base, quote]]);
    } catch (error) {
      console.log({ error, currentAPI });
      currentAPI.close();
      reject(error);
    }

    if (!balances) {
      reject(new Error("Account balances not found"));
      return;
    }

    const now = new Date().toISOString().slice(0, 19);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19);
    let marketHistory;
    try {
      marketHistory = await currentAPI
        .db_api()
        .exec("get_trade_history", [base, quote, now, oneMonthAgo, 100]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    if (!marketHistory) {
      reject(new Error("Market history not found"));
      return;
    }

    let fullAccount;
    try {
      fullAccount = await currentAPI
        .db_api()
        .exec("get_full_accounts", [[accountID], false]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    if (!fullAccount) {
      reject(new Error("Account not found"));
      return;
    }

    let usrTrades;
    try {
      usrTrades = await currentAPI
        .history_api()
        .exec("get_account_history_operations", [
          accountID,
          4,
          "1.11.0",
          "1.11.0",
          100,
        ]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    if (!usrTrades) {
      reject(new Error("Account not found"));
      return;
    }

    let ticker;
    try {
      ticker = await currentAPI.db_api().exec("get_ticker", [base, quote]);
    } catch (error) {
      console.log(error);
      currentAPI.close();
      reject(error);
    }

    if (!ticker) {
      reject(new Error("Ticker not found"));
      return;
    }

    try {
      currentAPI.close();
    } catch (error) {
      console.log(error);
    }

    const result = {
      balances, // qty held quote & base assets
      marketHistory: marketHistory.map((x: any) => {
        return {
          date: x.date,
          price: x.price,
          amount: x.amount,
          value: x.value,
          type: x.type,
        };
      }), // recent trades
      accountLimitOrders: fullAccount[0][1].limit_orders.map((x: any) => {
        return {
          expiration: x.expiration,
          for_sale: x.for_sale,
          sell_price: x.sell_price,
        };
      }),
      usrTrades: usrTrades.filter(
        (x: any) =>
          x.op[1].fill_price.base.asset_id === base &&
          x.op[1].fill_price.quote.asset_id === quote
      ),
      ticker,
    };
    resolve(validResult(result));
  });
}

/**
 * Get the latest ID for an object in the blockchain
 * @param chain
 * @param space_id 1.x.x
 * @param type_id x.1.x
 * @param newNode
 * @param app
 * @returns number
 */
async function getMaxObjectIDs(
  chain: string,
  space_id: number,
  type_id: number,
  newNode?: string,
  app?: any
) {
  return new Promise(async (resolve, reject) => {
    let node: string;
    if (app) {
      node = getCurrentNode(chain, app);
    } else if (!app && newNode) {
      node = newNode;
    } else {
      node = chains[chain].nodeList[0].url;
    }

    let currentAPI;
    try {
      currentAPI = await Apis.instance(
        node,
        true,
        4000,
        { enableDatabase: true },
        (error: Error) => console.log(error)
      );
    } catch (error) {
      console.log({ error, node });
      if (app) {
        changeURL(chain, app);
      } else {
        console.log("Trying another node");
        return resolve(
          getMaxObjectIDs(
            chain,
            space_id,
            type_id,
            chains[chain].nodeList
              .map((x: any) => x.url)
              .filter((x: string) => x !== node)[0]
          )
        );
      }
      reject(error);
      return;
    }

    let nextObjectId;
    try {
      nextObjectId = await currentAPI
        .db_api()
        .exec("get_next_object_id", [space_id, type_id, false]);
    } catch (error) {
      console.log({ error, space_id, type_id });
      currentAPI.close();
      if (!app) {
        console.log("Trying another node");
        return resolve(
          getMaxObjectIDs(
            chain,
            space_id,
            type_id,
            chains[chain].nodeList
              .map((x: any) => x.url)
              .filter((x: string) => x !== node)[0]
          )
        );
      }
      reject(error);
      return;
    }

    currentAPI.close();

    // The next object ID is the maximum object ID plus one, so subtract one to get the maximum object ID
    resolve(parseInt(nextObjectId.split(".")[2]) - 1);
  });
}

export {
  generateDeepLink,
  getObjects,
  accountSearch,
  getBlockedAccounts,
  fetchOrderBook,
  fetchLimitOrders,
  getFullAccounts,
  getAccountBalances,
  getAccountHistory,
  getLimitOrders,
  getPortfolio,
  getMarketTrades,
  fetchMarkets,
  getMaxObjectIDs,
  fetchCreditDeals,
};
