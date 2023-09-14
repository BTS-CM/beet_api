import fs from 'fs';

const chains = [
    "bitshares", "bitshares_testnet"
];

const urls = {
    bitshares: 'https://api.bitshares.ws/openexplorer/pools',
    bitshares_testnet: 'https://api.testnet.bitshares.ws/openexplorer/pools'
};

for (const chain of chains) {
    const url = urls[chain];
    fetch(url)
        .then(res => res.json())
        .then(data => {
            fs.writeFile(`./src/data/${chain}/allPools.json`, JSON.stringify(data, undefined, 4), (err) => {
                if (err) throw err;
                console.log('Pools data saved to allPools.json');
            });

            const filteredPoolData = data.map(pool => {
                return {
                    id: pool.id,
                    asset_a_id: pool.asset_a,
                    asset_a_symbol: pool.details.asset_a.symbol,
                    asset_b_id: pool.asset_b,
                    asset_b_symbol: pool.details.asset_b.symbol,
                    share_asset_symbol: pool.details.share_asset.symbol,
                    balance_a: pool.balance_a,
                    balance_b: pool.balance_b,
                    taker_fee_percent: pool.taker_fee_percent,
                }
            });

            fs.writeFile(`./src/data/${chain}/pools.json`, JSON.stringify(filteredPoolData, undefined, 4), (err) => {
                if (err) throw err;
                console.log('Pools data saved to pools.json');
            });
        })
        .catch(err => console.log('Error: ' + err.message));
}

