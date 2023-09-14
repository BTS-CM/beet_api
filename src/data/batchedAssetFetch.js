import fs from 'fs';
import { getObjects } from "../lib.js";

const chains = [
  "bitshares", "bitshares_testnet"
];

const maxObjectIDs = {
  bitshares: 6452,
  bitshares_testnet: 2000
};

const getAllAssetData = async (chain) => {
  const allData = [];
  
  let objectIds = Array.from({length: maxObjectIDs[chain]}, (_, i) => `1.3.${i}`);

  let existingAssetFile;
  try {
    existingAssetFile = JSON.parse(fs.readFileSync(`./src/data/${chain}/allAssets.json`));
  } catch (error) {
    console.log(`Error reading file: ${error.message}`);
  }

  if (existingAssetFile) {
    // avoid trying to fetch the same assets again
    const existingAssets = existingAssetFile.map(asset => asset.id);
    objectIds = objectIds.filter(id => !existingAssets.includes(id));
    objectIds = objectIds.filter(id => {
      // Filtering out dead assets
      const idValue = id.split('.')[2];
      return parseInt(idValue) > 200;
    });
    console.log(`Found ${existingAssetFile.length} existing assets`);

    allData.push(...existingAssetFile);
  }

  if (!objectIds.length) {
    console.log(`No new assets to fetch for ${chain}`);
    return allData;
  }

  console.log(`Fetching ${chain} asset data for ${objectIds.length} remaining assets`);
  let assetData;
  try {
    assetData = await getObjects(chain, objectIds);
  } catch (error) {
    console.log(error);
    return;
  }

  allData.push(...assetData.map((asset) => ({
    id: asset.id,
    symbol: asset.symbol,
    precision: asset.precision,
    issuer: asset.issuer,
    market_fee_percent: asset.options.market_fee_percent,
    max_market_fee: asset.options.max_market_fee,
    max_supply: asset.options.max_supply
  })));

  return allData;
};

function writeToFile (data, chain, fileName) {
  console.log(`Writing to ./src/data/${chain}/${fileName}.json`);
  fs.writeFileSync(
    `./src/data/${chain}/${fileName}.json`,
    JSON.stringify(data, undefined, 4)
  );
};

const main = async () => {
  for (const chain of chains) {
    const allData = await getAllAssetData(chain);
    writeToFile(allData, chain, "allAssets");
  }

  for (const chain of ["bitshares", "bitshares_testnet"]) {
    const allData = JSON.parse(fs.readFileSync(`./src/data/${chain}/allAssets.json`));
    const pools = JSON.parse(fs.readFileSync(`./src/data/${chain}/pools.json`));

    const objectIds = [...new Set(pools.flatMap((pool) => {
      return [pool.asset_a_id, pool.asset_b_id]
    }))];

    writeToFile(
      allData.filter(asset => objectIds.includes(asset.id)), // only keep assets that are in the pools
      chain,
      "poolAssets"
    );
  }
  process.exit(0);
};

main();