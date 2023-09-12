import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { rateLimit } from 'elysia-rate-limit'

import { generateDeepLink } from './lib';

const app = new Elysia()
                .use(swagger())
                //.use(cors()) // for local dev only
                .use(cors({
                  origin: /\*.vercel.app$/
                }))
                .use(
                  rateLimit({
                    duration: 60 * 60 * 1000, // 1 hour
                    max: 60, // 500 req per hour
                  })
                )
                .onError(({ code, error }) => {
                  return new Response(error.toString())
                })
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
