import fs from "fs";
import { getObjects, getMaxObjectIDs } from "../lib/api";

const chains = ["bitshares", "bitshares_testnet"];

const getAllOfferData = async (chain) => {
  let maxObjectID;
  try {
    maxObjectID = await getMaxObjectIDs(chain, 1, 21);
  } catch (error) {
    console.log({ error });
    return;
  }

  let objectIds = Array.from({ length: maxObjectID }, (_, i) => `1.21.${i}`);

  console.log(`Fetching ${chain} offer data for ${objectIds.length} offers!`);

  let data;
  try {
    data = await getObjects(chain, objectIds);
  } catch (error) {
    console.log(error);
    console.log(`Check you're not fetching ${chain} assets which don't exist.`);
    return;
  }

  return data;
};

function writeToFile(data, chain, fileName) {
  console.log(`Writing to ./src/data/${chain}/${fileName}.json`);
  fs.writeFileSync(
    `./src/data/${chain}/${fileName}.json`,
    JSON.stringify(data, undefined, 4)
  );
}

const main = async () => {
  let allData = [];
  for (const chain of chains) {
    allData = await getAllOfferData(chain);
    if (allData) {
      writeToFile(allData, chain, "allOffers");
    }
  }
  process.exit(0);
};

main();
