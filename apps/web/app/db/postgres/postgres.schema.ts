import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const dummy = pgTable("dummy", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const schema = {
  dummy,
};
