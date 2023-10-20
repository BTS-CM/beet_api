# beet_api

An ElysiaJS based API for generating Bitshares Beet wallet deeplinks

First [install Bun](https://bun.sh/docs/installation) on your computer.

This API was developed using Linux on Windows via [WSL](https://learn.microsoft.com/en-us/windows/wsl/install).

Before running this Bitshares Beet API, please run the following commands:

```
bun install
bun run freshDataFetch
```

Then you can run the following commands:

To run the dev server

`bun run dev`

To fetch a web front end UI

`bun run constructUI`

To compile the beet_api into a linux executable

`bun run compile`

---

Once the elysia server is running, navigate to:

`http://localhost:8080/` to view

`http://localhost:8080/swagger` for a swagger docs page.

---

To run the compiled executable, run: `./beet_api` in the terminal.
