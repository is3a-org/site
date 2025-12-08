import { drizzle } from "drizzle-orm/node-postgres";

import { schema } from "./postgres.schema.ts";
import { Pool } from "pg";

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
