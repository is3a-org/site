import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./app/db/is3a-d1/is3a-d1.schema.ts"],
  out: "./app/db/is3a-d1/migrations",
});
