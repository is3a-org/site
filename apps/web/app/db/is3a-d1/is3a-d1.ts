import { drizzle } from "drizzle-orm/d1";
import { schema } from "./is3a-d1.schema";

export function createIs3aD1(cfDbOrCtx: D1Database | CloudflareEnv) {
  const cfDb = "IS3A_D1" in cfDbOrCtx ? cfDbOrCtx.IS3A_D1 : cfDbOrCtx;

  return drizzle(cfDb, { schema });
}

export type Is3aD1 = ReturnType<typeof createIs3aD1>;
