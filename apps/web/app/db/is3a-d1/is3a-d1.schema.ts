import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const dummy = sqliteTable("dummy", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const schema = {
  dummy,
};
