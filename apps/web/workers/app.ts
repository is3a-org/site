import { createRequestHandler } from "react-router";

import {
  createDrizzleDatabase,
  createPostgresClient,
  type DrizzleDatabase,
} from "~/db/postgres/is3a-postgres";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
    };
    db: DrizzleDatabase;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const client = createPostgresClient();
    try {
      await client.connect();
      const db = createDrizzleDatabase(client);

      return await requestHandler(request, {
        cloudflare: { env, ctx },
        db,
      });
    } catch (error) {
      console.error("Error fetching request", error);
      return new Response("Internal Server Error", { status: 500 });
    } finally {
      await client.end();
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
