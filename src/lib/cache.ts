import { validResult } from "./common";

import bts_allPools from "../data/bitshares/allPools.json";
import bts_allAssets from "../data/bitshares/allAssets.json";
import bts_allDynamicData from "../data/bitshares/dynamicData.json";
import bts_assetIssuers from "../data/bitshares/assetIssuers.json";

import test_allPools from "../data/bitshares_testnet/allPools.json";
import test_allAssets from "../data/bitshares_testnet/allAssets.json";
import test_allDynamicData from "../data/bitshares_testnet/dynamicData.json";
import test_assetIssuers from "../data/bitshares_testnet/assetIssuers.json";

/**
 * Retrieves the requested asset from cached assets
 * @param chain 
 * @param id 
 * @returns Response
 */
function getAsset(chain: string, id: string) {
  let foundAsset;
  if (chain === "bitshares") {
    foundAsset = bts_allAssets.find((asset: any) => (asset.id === id || asset.symbol === id));
  } else if (chain === "bitshares_testnet") {
    foundAsset = test_allAssets.find((asset: any) => (asset.id === id || asset.symbol === id));
  }

  if (foundAsset) {
    return foundAsset;
  }
}

/**
 * Retrieves the requested asset from cached assets
 * @param chain
 */
function getMarketSearch(chain: string) {
  let foundAssets = chain === "bitshares" ? bts_allAssets : test_allAssets;
  let foundIssuers = chain === "bitshares" ? bts_assetIssuers : test_assetIssuers;

  const marketData = foundAssets.map((asset: any) => {
     /*
      {
        "id": "1.3.0",
        "symbol": "BTS",
        "precision": 5,
        "issuer": "1.2.3",
        "market_fee_percent": 0,
        "max_market_fee": "1000000000000000",
        "max_supply": "360057050210207"
      }
      {
        "id": "1.2.3",
        "ltm": true,
        "name": "null-account"
      }
    */
    const thisIssuer = foundIssuers.find((issuer: any) => issuer.id === asset.issuer);
    const issuerString = `${thisIssuer?.name ?? '???'} (${asset.issuer}) ${thisIssuer?.ltm ? '(LTM)' : ''}`;
    return {
      id: asset.id,
      s: asset.symbol,
      u: issuerString,
    }
  });

  if (marketData && marketData.length > 0) {
    return marketData;
  }
}

/**
 * Get the dynamic data of an asset
 * @param chain 
 * @param id 2.3.x
 * @returns Response
 */
function getDynamicData(chain: string, id: string) {
  let foundDynamicData;
  if (chain === "bitshares") {
    foundDynamicData = bts_allDynamicData.find((dynamicData: any) => dynamicData.id === id);
  } else if (chain === "bitshares_testnet") {
    foundDynamicData = test_allDynamicData.find((dynamicData: any) => dynamicData.id === id);
  }

  if (!foundDynamicData) {
    throw new Error("Dynamic data not found");
  }

  return validResult(foundDynamicData);
}

/**
 * Retrieves the requested pool from cached assets
 * @param chain 
 * @param id 
 * @returns Response
 */
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
  
  return validResult(foundPool);
}

export {
  getAsset,
  getPool,
  getDynamicData,
  getMarketSearch,
}