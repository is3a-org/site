import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./postgres.schema.ts";

export function createPostgresPool() {
  return new Pool({
    connectionString: process.env.PG_DATABASE_URL!,
  });
}

export function createDrizzleDatabase(pool: Pool) {
  return drizzle({ client: pool, schema });
}

export type DrizzleDatabase = ReturnType<typeof createDrizzleDatabase>;
export type PostgresPool = Pool;
