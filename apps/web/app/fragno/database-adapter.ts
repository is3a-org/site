import { DrizzleAdapter } from "@fragno-dev/db/adapters/drizzle";
import type { DrizzleDatabase } from "../db/postgres/is3a-postgres.ts";

export function createAdapter(db: DrizzleDatabase | (() => DrizzleDatabase)) {
  return new DrizzleAdapter({
    db: async () => (typeof db === "function" ? db() : db),
    provider: "postgresql",
  });
}
