import { DrizzleAdapter } from "@fragno-dev/db/adapters/drizzle";
import type { DrizzleDatabase } from "../db/postgres/is3a-postgres.ts";

export function createAdapter(db: DrizzleDatabase | (() => DrizzleDatabase)) {
  if (typeof db === "function") {
    console.log("Created adapter for top-level Fragment");

    const topLevelAdapter = new DrizzleAdapter({
      db: db(),
      provider: "postgresql",
    });

    return topLevelAdapter;
  }

  return new DrizzleAdapter({
    db,
    provider: "postgresql",
  });
}
