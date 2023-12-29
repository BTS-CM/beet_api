# beet_api

An ElysiaJS based API for generating Bitshares Beet wallet deeplinks

First [install Bun](https://bun.sh/docs/installation) on your computer.

This API was developed using Linux on Windows via [WSL](https://learn.microsoft.com/en-us/windows/wsl/install).

Before running this Bitshares Beet API, you need to install the required packages:

```
bun upgrade
bun install
```

You then need to fetch the required data for the API to serve to the constructed UI.

You can either fetch it all in the one go (which might fail):

```
bun run refreshData
```

Or you can manually run each script:

```
bun run eraseChainData
bun run fetchPools
bun run fetchAssets
bun run fetchDynamicData
bun run fetchIssuers
bun run fetchBitassetData
bun run fetchOffers
bun run fetchDeals
bun run fetchFees
```

With the required chain data in place, you can then fetch the example [Astro UI](https://github.com/BTS-CM/astro-ui) for the public folder:

```
bun run constructUI
```

The above UI is optional, you can create your own application UI which queries the elysia server.

You can now run the dev server:

`bun run dev`

And you can now compile the beet_api into a linux executable:

`bun run compile`

---

Once the elysia server is running, navigate to:

`http://localhost:8080/` to view

`http://localhost:8080/swagger` for a swagger docs page.

---

To run the compiled executable, run: `./beet_api` in the WSL/Linux terminal.
