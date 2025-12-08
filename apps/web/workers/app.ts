import { createRequestHandler } from "react-router";
import type { Pool } from "pg";

import {
  createDrizzleDatabase,
  createPostgresPool,
  type DrizzleDatabase,
} from "~/db/postgres/is3a-postgres";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
    };
    pool: Pool;
    db: DrizzleDatabase;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const pool = createPostgresPool();
    try {
      const db = createDrizzleDatabase(pool);

      return await requestHandler(request, {
        cloudflare: { env, ctx },
        pool,
        db,
      });
    } catch (error) {
      console.error("Error fetching request", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
