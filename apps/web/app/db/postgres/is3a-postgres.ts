import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./postgres.schema.ts";

export function createPostgresPool(): Pool {
  return new Pool({
    connectionString: process.env.PG_DATABASE_URL,
  });
}

/** A PostgreSQL database bound to the application schema and its pool. */
export type DrizzleDatabase = NodePgDatabase<typeof schema> & { $client: Pool };

export function createDrizzleDatabase(pool: Pool): DrizzleDatabase {
  return drizzle({ client: pool, schema });
}

export type PostgresPool = Pool;

/** Resolves the database connection pool or its lazy factory without changing pool ownership. */
export function resolvePostgresPool(pool: PostgresPool | (() => PostgresPool)): PostgresPool {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: PostgreSQL integrations accept a Pool capability or its lazy factory.
  return typeof pool === "function" ? pool() : pool;
}
