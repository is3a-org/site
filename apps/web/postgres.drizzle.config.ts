import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({
  path: ".dev.vars",
});

if (!process.env.PG_DATABASE_URL) {
  throw new Error("PG_DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./app/db/postgres/postgres.schema.ts"],
  out: "./app/db/postgres/migrations",
  dbCredentials: {
    url: process.env.PG_DATABASE_URL!,
  },
});
