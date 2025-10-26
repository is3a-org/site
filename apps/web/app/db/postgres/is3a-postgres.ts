import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./postgres.schema";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

console.log("process.env.PG_DATABASE_URL", process.env.PG_DATABASE_URL);

export const db = drizzle({ client: pool, schema });
