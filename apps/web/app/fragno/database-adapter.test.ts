import { SqlAdapter } from "@fragno-dev/db/adapters/sql";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vite-plus/test";

import { resolvePostgresPool } from "../db/postgres/is3a-postgres";
import { createAdapter } from "./database-adapter";

describe("PostgreSQL connection capabilities", () => {
  const pool = new Pool();

  afterAll(async () => {
    await pool.end();
  });

  it("preserves an existing pool when resolving the connection capability", () => {
    expect(resolvePostgresPool(pool)).toBe(pool);
    expect(createAdapter(pool)).toBeInstanceOf(SqlAdapter);
  });

  it("evaluates each lazy pool factory exactly once", () => {
    let resolverCalls = 0;
    let adapterCalls = 0;

    const resolvedPool = resolvePostgresPool(() => {
      resolverCalls++;
      return pool;
    });
    const adapter = createAdapter(() => {
      adapterCalls++;
      return pool;
    });

    expect(resolvedPool).toBe(pool);
    expect(resolverCalls).toBe(1);
    expect(adapter).toBeInstanceOf(SqlAdapter);
    expect(adapterCalls).toBe(1);
  });
});
