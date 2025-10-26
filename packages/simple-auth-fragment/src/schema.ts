import { column, idColumn, schema } from "@fragno-dev/db/schema";

export const authSchema = schema((s) => {
  return s
    .addTable("user", (t) => {
      return t
        .addColumn("id", idColumn())
        .addColumn("email", column("string"))
        .addColumn("passwordHash", column("string"))
        .addColumn(
          "createdAt",
          column("timestamp").defaultTo((b) => b.now()),
        )
        .createIndex("idx_user_email", ["email"]);
    })
    .addTable("session", (t) => {
      return t
        .addColumn("id", idColumn())
        .addColumn("userId", column("string"))
        .addColumn("expiresAt", column("timestamp"))
        .addColumn(
          "createdAt",
          column("timestamp").defaultTo((b) => b.now()),
        )
        .createIndex("idx_session_user", ["userId"]);
    });
});
