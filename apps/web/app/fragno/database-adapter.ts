import { DrizzleAdapter } from "@fragno-dev/db/adapters/drizzle";
import { NodePostgresDriverConfig } from "@fragno-dev/db/drivers";
import { PostgresDialect } from "@fragno-dev/db/dialects";
import type { PostgresPool } from "../db/postgres/is3a-postgres.ts";

export function createAdapter(pool: PostgresPool | (() => PostgresPool)) {
  const resolvedPool = typeof pool === "function" ? pool() : pool;

  if (typeof pool === "function") {
    console.log("Created adapter for top-level Fragment");
  }

  const dialect = new PostgresDialect({ pool: resolvedPool });

  return new DrizzleAdapter({
    dialect,
    driverConfig: new NodePostgresDriverConfig(),
  });
}
