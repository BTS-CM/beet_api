import { v4 as uuidv4 } from 'uuid';
import { Apis, TransactionBuilder } from "bts-buntime";

import { chains } from "../config/chains";

import { changeURL, getCurrentNode } from './states';
import { validResult } from './common';

/**
 * Returns deeplink contents
 * @param chain
 * @param opType
 * @param operations
 * @param app
 * @returns generated deeplink
 */
async function generateDeepLink(chain: String, opType: String, operations: Array<Object>, app: any) {
    return new Promise(async (resolve, reject) => {
        const node = getCurrentNode(chain, app);

        try {
            await Apis.instance(
                node,
                true,
                10000,
                { enableCrypto: false, enableOrders: true },
                (error: Error) => console.log(error),
            ).init_promise;
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
            await tr.update_head_block(Apis);
        } catch (error) {
            console.error(error);
            Apis.close();
            reject(error);
            return;
        }

        try {
            await tr.set_required_fees(null, null, Apis);
        } catch (error) {
            console.error(error);
            Apis.close();
            reject(error);
            return;
        }

        try {
            tr.set_expire_seconds(7200);
        } catch (error) {
            console.error(error);
            Apis.close();
            reject(error);
            return;
        }

        try {
            tr.finalize(Apis);
        } catch (error) {
            console.error(error);
            Apis.close();
            reject(error);
            return;
        }

        const request = {
            type: 'api',
            id: await uuidv4(),
            payload: {
                method: 'injectedCall',
                params: [
                    "signAndBroadcast",
                    JSON.stringify(tr.toObject()),
                    [],
                ],
                appName: "Static Bitshares Astro web app",
                chain: chain === 'bitshares' ? "BTS" : "TEST",
                browser: 'web browser',
                origin: 'localhost'
            }
        };

        Apis.close();

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
async function getObjects(chain: String, object_ids: Array<String>, app: any) {
  return new Promise(async (resolve, reject) => {
    const node = app ? getCurrentNode(chain, app) : chains[chain].nodeList[0].url;

    try {
        await Apis.instance(
            node,
            true,
            10000,
            { enableCrypto: false, enableOrders: true },
            (error: Error) => console.log(error),
        ).init_promise;
    } catch (error) {
        console.log(error);
        Apis.close();
        if (app) {
            changeURL(chain, app);
        }
        reject(error);
        return;
    }

    let retrievedObjects: Object[] = [];
    const chunksOfInputs = _sliceIntoChunks(object_ids, 100);
    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      let got_objects;
      try {
        got_objects = await Apis.instance().db_api().exec("get_objects", [currentChunk, false]);
      } catch (error) {
        console.log(error);
        continue;
      }

      if (got_objects && got_objects.length) {
        retrievedObjects = retrievedObjects.concat(got_objects.filter((x) => x !== null));
      }
    }

    Apis.close();

    if (retrievedObjects && retrievedObjects.length) {
      resolve(validResult(retrievedObjects));
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

      try {
        await Apis.instance(node, true).init_promise;
      } catch (error) {
        console.log(error);
        changeURL(chain, app);
        reject(error);
        return;
      }
  
      if (!Apis.instance().db_api()) {
        console.log("no db_api");
        Apis.close();
        reject(new Error("no db_api"));
        return;
      }
  
      let object;
      try {
        object = await Apis.instance().db_api().exec("get_accounts", [['committee-blacklist-manager']]);
      } catch (error) {
        console.log(error);
        Apis.close();
        reject(error);
      }
  
      Apis.close();

      if (!object) {
        reject(new Error('Committee account details not found'));
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

        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            changeURL(chain, app);
            reject(error);
            return;
        }

        if (!Apis.instance().db_api()) {
            console.log("no db_api");
            Apis.close();
            changeURL(chain, app);
            reject(new Error("no db_api"));
            return;
        }

        let object;
        try {
            object = await Apis.instance().db_api().exec("get_accounts", [[search_string]]);
        } catch (error) {
            console.log(error);
            Apis.close();
            reject(error);
        }

        if (!object || !object.length) {
            return reject(new Error("Couldn't retrieve account"));
        }

        Apis.close();
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
        
        try {
            await Apis.instance(node, true).init_promise;
        } catch (error) {
            console.log(error);
            changeURL(chain, app);
            reject(error);
            return;
        }

        if (!Apis.instance().db_api()) {
            console.log("no db_api");
            Apis.close();
            changeURL(chain, app);
            reject(new Error("no db_api"));
            return;
        }

        let object;
        try {
            object = await Apis.instance().db_api().exec("get_full_accounts", [[accountID], false]).then((results: Object[]) => {
                if (results && results.length) {
                    return results;
                }
            });
        } catch (error) {
            console.log(error);
            Apis.close();
            reject(error);
        }

        Apis.close();

        if (!object) {
            reject(new Error('Committee account details not found'));
            return;
        }

        resolve(validResult(object));
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
async function fetchOrderBook(chain: String, base: String, quote: String, app: any) {
    return new Promise(async (resolve, reject) => {
        const node = getCurrentNode(chain, app);

        try {
            await Apis.instance(node, true, 4000, undefined, () => {
                console.log(`OrderBook: Closed connection to: ${node}`);
            }).init_promise;
        } catch (error) {
            console.log(error);
            changeURL(chain, app);
            return reject(error);
        }

        let orderBook;
        try {
            orderBook = await Apis.instance().db_api().exec("get_order_book", [base, quote, 50])
        } catch (error) {
            console.log(error);
        }

        try {
            await Apis.close();
        } catch (error) {
            console.log(error);
        }

        if (!orderBook) {
            return reject(new Error("Couldn't retrieve orderbook"));
        }

        resolve(validResult(orderBook));
    });
}

export {
    generateDeepLink,
    getObjects,
    accountSearch,
    getBlockedAccounts,
    getFullAccounts,
    fetchOrderBook
};
