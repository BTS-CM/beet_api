import * as fflate from "fflate";
import { validResult } from "./common";

import bts_fees from "../data/bitshares/fees.json";
import bts_offers from "../data/bitshares/allOffers.json";
import bts_pools from "../data/bitshares/pools.json";
import bts_allPools from "../data/bitshares/allPools.json";
import bts_minBitassets from "../data/bitshares/minBitassetData.json";
import bts_allAssets from "../data/bitshares/allAssets.json";
import bts_minAssets from "../data/bitshares/minAssets.json";
import bts_allDynamicData from "../data/bitshares/dynamicData.json";
import bts_assetIssuers from "../data/bitshares/assetIssuers.json";

import bts_min_pools from "../data/bitshares/minPools.json";
import test_min_pools from "../data/bitshares_testnet/minPools.json";

import test_fees from "../data/bitshares_testnet/fees.json";
import test_offers from "../data/bitshares_testnet/allOffers.json";
import test_pools from "../data/bitshares_testnet/pools.json";
import test_allPools from "../data/bitshares_testnet/allPools.json";
import test_minBitassets from "../data/bitshares_testnet/minBitassetData.json";
import test_allAssets from "../data/bitshares_testnet/allAssets.json";
import test_minAssets from "../data/bitshares_testnet/minAssets.json";
import test_allDynamicData from "../data/bitshares_testnet/dynamicData.json";
import test_assetIssuers from "../data/bitshares_testnet/assetIssuers.json";

const locales = ["en", "da", "de", "es", "fr", "it", "ja", "ko", "pt", "th"];

const pages = [
  "AccountSearch",
  "AccountSelect",
  "AssetDropDownCard",
  "CreateCreditOffer",
  "CreditBorrow",
  "CreditDeals",
  "CreditOffer",
  "CreditOfferEditor",
  "CurrentUser",
  "DeepLinkDialog",
  "ExternalLink",
  "Featured",
  "Home",
  "LimitOrderCard",
  "LTM",
  "Market",
  "MarketAssetCard",
  "MarketOrder",
  "MarketOrderCard",
  "MarketPlaceholder",
  "MarketSummaryTabs",
  "MarketTradeContents",
  "MyCompletedTrades",
  "MyOpenOrders",
  "MyOrderSummary",
  "MyTradeSummary",
  "PageHeader",
  "PageFooter",
  "PoolDialogs",
  "PoolForm",
  "PoolStake",
  "PortfolioTabs",
  "Settlement",
  "Smartcoin",
  "Smartcoins",
  "Transfer",
];

async function fetchLocales() {
  const translations = {};
  for (const language of locales) {
    const localPages = {};
    for (const page of pages) {
      const file = Bun.file(`src/data/locales/${language}/${page}.json`);
      //src\data\locales\en\AccountSearch.json
      const _jsonContents = await file.json();
      localPages[page] = _jsonContents;
    }
    translations[language] = localPages;
  }
  return translations;
}

const localeJSON = await fetchLocales();

// Creates a gzip compressed binary string
const compressContent = (content: any) => {
  return fflate.strFromU8(fflate.compressSync(fflate.strToU8(JSON.stringify(content))), true);
};

// Preps the market data for further compression
const compressMarketData = (assets: any, issuers: any) => {
  return compressContent(
    assets.map((asset: any) => {
      const thisIssuer = issuers.find((issuer: any) => issuer.id === asset.issuer);
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

const btsFeeSchedule = compressContent(bts_fees);
const testFeeSchedule = compressContent(test_fees);

const btsOffers = compressContent(
  bts_offers
    .filter((x) => x.enabled === true) // only provide active offers
    .filter((x) => x.fee_rate < 500000) // max fee rate of 50%
);
const testOffers = compressContent(test_offers.filter((x) => x.enabled === true));

const btsPools = compressContent(bts_pools);
const testPools = compressContent(test_pools);

const btsMinPools = compressContent(bts_min_pools);
const testMinPools = compressContent(test_min_pools);

const btsMinBitassets = compressContent(bts_minBitassets);
const testMinBitassets = compressContent(test_minBitassets);

const compressedBTSAssets = compressContent(bts_allAssets);
const compressedTestAssets = compressContent(test_allAssets);

const compressedMinBTSAssets = compressContent(bts_minAssets);
const compressedMinTestAssets = compressContent(test_minAssets);

const btsMarketData = compressMarketData(bts_allAssets, bts_assetIssuers);
const testMarketData = compressMarketData(test_allAssets, test_assetIssuers);

/**
 * Returns all cached assets for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getAllAssets(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult(
      { bitshares: compressedBTSAssets, bitshares_testnet: compressedTestAssets },
      false
    );
  }
  return validResult(chain === "bitshares" ? compressedBTSAssets : compressedTestAssets, false);
}

/**
 * Returns all minimised cached assets for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getMinAssets(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult(
      { bitshares: compressedMinBTSAssets, bitshares_testnet: compressedMinTestAssets },
      false
    );
  }
  return validResult(
    chain === "bitshares" ? compressedMinBTSAssets : compressedMinTestAssets,
    false
  );
}

/**
 * Retrieves the requested market search data for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getMarketSearch(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsMarketData, bitshares_testnet: testMarketData }, false);
  }
  return validResult(chain === "bitshares" ? btsMarketData : testMarketData, false);
}

/**
 * Retrieves the pool summary data for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getPools(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsPools, bitshares_testnet: testPools }, false);
  }
  return validResult(chain === "bitshares" ? btsPools : testPools, false);
}

function getMinPools(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsMinPools, bitshares_testnet: testMinPools }, false);
  }
  return validResult(chain === "bitshares" ? btsMinPools : testMinPools, false);
}

/**
 * Retrieves the minimum bitassets for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getMinBitassets(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsMinBitassets, bitshares_testnet: testMinBitassets }, false);
  }
  return validResult(chain === "bitshares" ? btsMinBitassets : testMinBitassets, false);
}

/**
 * Retrieves the active offers for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getActiveOffers(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsOffers, bitshares_testnet: testOffers }, false);
  }
  return validResult(chain === "bitshares" ? btsOffers : testOffers, false);
}

/**
 * Retrieves the requested fee schedule for one/many blockchain(s)
 * @param mode
 * @param chain
 */
function getFeeSchedule(mode: string = "both", chain: string = "bitshares") {
  if (mode === "both") {
    return validResult({ bitshares: btsFeeSchedule, bitshares_testnet: testFeeSchedule }, false);
  }
  return validResult(chain === "bitshares" ? btsFeeSchedule : testFeeSchedule, false);
}

/**
 * Retrieves the requested asset from cached assets
 * @param chain
 * @param id
 * @returns Response
 */
function getAsset(chain: string, id: string) {
  let foundAsset;
  if (chain === "bitshares") {
    foundAsset = bts_allAssets.find((asset: any) => asset.id === id || asset.symbol === id);
  } else if (chain === "bitshares_testnet") {
    foundAsset = test_allAssets.find((asset: any) => asset.id === id || asset.symbol === id);
  }

  if (foundAsset) {
    return foundAsset;
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

/**
 * Return the requested locale strings for the
 * @param localeString
 * @returns Response
 */
function getTranslations(localeString: string) {
  if (!locales.includes(localeString) || !localeJSON[localeString]) {
    throw new Error("Locale not found");
  }
  return validResult(localeJSON[localeString]);
}

export {
  getFeeSchedule,
  getAsset,
  getPool,
  getDynamicData,
  getMarketSearch,
  getAllAssets,
  getMinAssets,
  getPools,
  getMinPools,
  getMinBitassets,
  getActiveOffers,
  getTranslations,
};
