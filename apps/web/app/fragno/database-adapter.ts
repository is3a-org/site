import { DrizzleAdapter } from "@fragno-dev/db/adapters/drizzle";
import { db } from "../db/postgres/is3a-postgres.ts";

export function createAdapter() {
  return new DrizzleAdapter({
    db,
    provider: "postgresql",
  });
}
