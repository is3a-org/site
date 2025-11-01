import { drizzle } from "drizzle-orm/node-postgres";

import { schema } from "./postgres.schema.ts";
import { Client } from "pg";

export function createPostgresClient() {
  return new Client({
    connectionString: process.env.PG_DATABASE_URL!,
    // query_timeout: 1000,
    // statement_timeout: 1000,
    // connectionTimeoutMillis: 1000,
  });
}

export function createDrizzleDatabase(client: Client) {
  return drizzle({ client, schema, casing: "snake_case" });
}

export type DrizzleDatabase = ReturnType<typeof createDrizzleDatabase>;
