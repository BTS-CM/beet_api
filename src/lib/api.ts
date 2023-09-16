import { v4 as uuidv4 } from 'uuid';

import { TransactionBuilder } from "bitsharesjs";
import { Apis } from "bitsharesjs-ws";

import { chains } from "../config/chains";

/**
 * Returns deeplink contents
 * @param {String} chain
 * @param {String} opType
 * @param {Array} operations
 * @returns {String}
 */
async function generateDeepLink(chain: String, opType: String, operations: Array<Object>) {
    return new Promise(async (resolve, reject) => {
        const currentConfig = chains[chain];
        const node = currentConfig.nodeList[0].url;
        const coreSymbol = currentConfig.coreSymbol;

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
            reject(error);
            return;
        }

        try {
            await tr.set_required_fees(null, null, Apis);
        } catch (error) {
            console.error(error);
            reject(error);
            return;
        }

        try {
            tr.set_expire_seconds(7200);
        } catch (error) {
            console.error(error);
            reject(error);
            return;
        }

        try {
            tr.finalize(Apis);
        } catch (error) {
            console.error(error);
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
                chain: coreSymbol,
                browser: 'web browser',
                origin: 'localhost'
            }
        };

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
 * @param {Array} arr 
 * @param {Number} size 
 * @returns {Array} [[{..}, ...], ...]
 */
function _sliceIntoChunks(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        const chunk = arr.slice(i, i + size);
        chunks.push(chunk);
    }
    return chunks;
}

/**
 * Get multiple objects such as accounts, assets, etc
 * @param {String} chain
 * @param {Array} object_ids
 */
async function getObjects(chain: String, object_ids: Array<String>) {
  return new Promise(async (resolve, reject) => {
    const currentConfig = chains[chain];
    const node = currentConfig.nodeList[0].url;

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

    if (retrievedObjects && retrievedObjects.length) {
      resolve(retrievedObjects);
    }
  });
}

export {
    generateDeepLink,
    getObjects,
};
