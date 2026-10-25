import type { Pool } from "pg";
import { createContext } from "react-router";

import type { DrizzleDatabase } from "~/db/postgres/is3a-postgres";

export const requestContext = createContext<{
  cloudflare: {
    env: CloudflareEnv;
    ctx: ExecutionContext;
  };
  pool: Pool;
  db: DrizzleDatabase;
}>();
