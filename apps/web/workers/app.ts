import { createRequestHandler, RouterContextProvider } from "react-router";

import { createDrizzleDatabase, createPostgresPool } from "~/db/postgres/is3a-postgres";
import { requestContext } from "~/request-context";

export { StripeFragmentDurableObject } from "~/fragno/stripe-durable-object";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const pool = createPostgresPool();
    try {
      const db = createDrizzleDatabase(pool);

      const context = new RouterContextProvider();
      context.set(requestContext, {
        cloudflare: { env, ctx },
        pool,
        db,
      });

      return await requestHandler(request, context);
    } catch (error) {
      console.error("Error fetching request", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
