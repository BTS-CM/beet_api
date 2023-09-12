import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { html } from '@elysiajs/html'
import { generateDeepLink } from './lib';

const app = new Elysia()
                .use(swagger())
                .use(html())
                .onError(({ code, error }) => {
                  return new Response(error.toString())
                })
                .get("/", () => Bun.file('./src/view/index.html')) // astro built files
                .get('/_astro/Form.js', () => Bun.file('./src/view/_astro/Form.js'))
                .get('/_astro/index.js', () => Bun.file('./src/view/_astro/index.js'))
                .get('/_astro/client.js', () => Bun.file('./src/view/_astro/client.js')) // end of astro files
                .post("/beet", async ({ body }) => {
                  if (!body || !JSON.parse(body)) {
                    throw new Error("Missing required fields");
                  }
                
                  let generatedDeepLink;
                  try {
                    generatedDeepLink = await generateDeepLink(JSON.parse(body));
                  } catch (error) {
                    throw error;
                  }
                
                  return new Response(
                    JSON.stringify({
                      message: "Success!",
                      generatedDeepLink
                    }),
                    {
                      status: 200,
                      headers: {
                        "Content-Type": "application/json"
                      }
                    }
                  );
                })
                .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} `
);
