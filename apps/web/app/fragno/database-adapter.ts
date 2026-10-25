import { SqlAdapter } from "@fragno-dev/db/adapters/sql";
import { PostgresDialect } from "@fragno-dev/db/dialects";
import { NodePostgresDriverConfig } from "@fragno-dev/db/drivers";

import type { PostgresPool } from "../db/postgres/is3a-postgres.ts";

export function createAdapter(pool: PostgresPool | (() => PostgresPool)): SqlAdapter {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: The adapter accepts a Pool capability or its lazy factory.
  const isPoolFactory = typeof pool === "function";
  const resolvedPool = isPoolFactory ? pool() : pool;

  if (isPoolFactory) {
    console.log("Created adapter for top-level Fragment");
  }

  const dialect = new PostgresDialect({ pool: resolvedPool });

  return new SqlAdapter({
    dialect,
    driverConfig: new NodePostgresDriverConfig(),
  });
}
