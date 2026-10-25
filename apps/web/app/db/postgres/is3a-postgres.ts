import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./postgres.schema.ts";

export function createPostgresPool(): Pool {
  return new Pool({
    connectionString: process.env.PG_DATABASE_URL!,
  });
}

/** A PostgreSQL database bound to the application schema and its pool. */
export type DrizzleDatabase = NodePgDatabase<typeof schema> & { $client: Pool };

export function createDrizzleDatabase(pool: Pool): DrizzleDatabase {
  return drizzle({ client: pool, schema });
}

export type PostgresPool = Pool;
