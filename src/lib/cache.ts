import * as fflate from "fflate";
import { validResult } from "./common";

import bts_offers from "../data/bitshares/allOffers.json";
import bts_pools from "../data/bitshares/pools.json";
import bts_allPools from "../data/bitshares/allPools.json";
import bts_allAssets from "../data/bitshares/allAssets.json";
import bts_allDynamicData from "../data/bitshares/dynamicData.json";
import bts_assetIssuers from "../data/bitshares/assetIssuers.json";

import test_offers from "../data/bitshares_testnet/allOffers.json";
import test_pools from "../data/bitshares_testnet/pools.json";
import test_allPools from "../data/bitshares_testnet/allPools.json";
import test_allAssets from "../data/bitshares_testnet/allAssets.json";
import test_allDynamicData from "../data/bitshares_testnet/dynamicData.json";
import test_assetIssuers from "../data/bitshares_testnet/assetIssuers.json";

// Creates a gzip compressed binary string
const compressContent = (content: any) => {
  return fflate.strFromU8(
    fflate.compressSync(fflate.strToU8(JSON.stringify(content))),
    true
  );
};

// Preps the market data for further compression
const compressMarketData = (assets: any, issuers: any) => {
  return compressContent(
    assets.map((asset: any) => {
      const thisIssuer = issuers.find(
        (issuer: any) => issuer.id === asset.issuer
      );
      const issuerString = `${thisIssuer?.name ?? "???"} (${asset.issuer}) ${
        thisIssuer?.ltm ? "(LTM)" : ""
      }`;
      return {
        id: asset.id,
        s: asset.symbol,
        u: issuerString,
        p: asset.precision,
      };
    })
  );
};

const btsOffers = compressContent(bts_offers.filter((x) => x.enabled === true));
const testOffers = compressContent(
  test_offers.filter((x) => x.enabled === true)
);

const btsPools = compressContent(bts_pools);
const testPools = compressContent(test_pools);

const compressedBTSAssets = compressContent(bts_allAssets);
const compressedTestAssets = compressContent(test_allAssets);

const btsMarketData = compressMarketData(bts_allAssets, bts_assetIssuers);
const testMarketData = compressMarketData(test_allAssets, test_assetIssuers);

/**
 * Retrieves the requested asset from cached assets
 * @param chain
 * @param id
 * @returns Response
 */
function getAsset(chain: string, id: string) {
  let foundAsset;
  if (chain === "bitshares") {
    foundAsset = bts_allAssets.find(
      (asset: any) => asset.id === id || asset.symbol === id
    );
  } else if (chain === "bitshares_testnet") {
    foundAsset = test_allAssets.find(
      (asset: any) => asset.id === id || asset.symbol === id
    );
  }

  if (foundAsset) {
    return foundAsset;
  }
}

/**
 * Returns all cached assets for a blockchain
 * @param chain
 */
function getAllAssets(chain: string) {
  return validResult(
    chain === "bitshares" ? compressedBTSAssets : compressedTestAssets
  );
}

/**
 * Retrieves the requested market search data for the requested chain
 * @param chain
 */
function getMarketSearch(chain: string) {
  return validResult(chain === "bitshares" ? btsMarketData : testMarketData);
}

/**
 * Retrieves the pool summary data for the requested chain
 * @param chain
 */
function getPools(chain: string) {
  return validResult(chain === "bitshares" ? btsPools : testPools);
}

/**
 * Retrieves the active offers for the requested chain
 * @param chain
 */
function getActiveOffers(chain: string) {
  return validResult(chain === "bitshares" ? btsOffers : testOffers);
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
    foundDynamicData = bts_allDynamicData.find(
      (dynamicData: any) => dynamicData.id === id
    );
  } else if (chain === "bitshares_testnet") {
    foundDynamicData = test_allDynamicData.find(
      (dynamicData: any) => dynamicData.id === id
    );
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
  getAllAssets,
  getPools,
  getActiveOffers,
};
