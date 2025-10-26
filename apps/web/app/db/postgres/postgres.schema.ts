import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { simple_auth_db_schema } from "./fragno-schema.ts";

export const dummy = pgTable("dummy", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const schema = {
  dummy,
  ...simple_auth_db_schema,
};
