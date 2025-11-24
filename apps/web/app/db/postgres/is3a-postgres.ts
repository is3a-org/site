import { drizzle } from "drizzle-orm/node-postgres";

import { schema } from "./postgres.schema.ts";
import { Client } from "pg";

export function createPostgresClient(url?: string) {
  return new Client({
    connectionString: process.env.PG_DATABASE_URL! ?? url,
  });
}

export function createDrizzleDatabase(client: Client) {
  return drizzle({ client, schema });
}

export type DrizzleDatabase = ReturnType<typeof createDrizzleDatabase>;
