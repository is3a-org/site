import { column, idColumn, referenceColumn, schema } from "@fragno-dev/db/schema";

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
        .addColumn("userId", referenceColumn())
        .addColumn("expiresAt", column("timestamp"))
        .addColumn(
          "createdAt",
          column("timestamp").defaultTo((b) => b.now()),
        )
        .createIndex("idx_session_user", ["userId"]);
    })
    .addReference("sessionOwner", {
      from: {
        table: "session",
        column: "userId",
      },
      to: {
        table: "user",
        column: "id",
      },
      type: "one",
    })
    .addTable("totp_secret", (t) => {
      return t
        .addColumn("id", idColumn())
        .addColumn("userId", referenceColumn())
        .addColumn("secret", column("string"))
        .addColumn("backupCodes", column("string"))
        .addColumn(
          "createdAt",
          column("timestamp").defaultTo((b) => b.now()),
        )
        .createIndex("idx_totp_user", ["userId"], { unique: true });
    })
    .addReference("totpOwner", {
      from: {
        table: "totp_secret",
        column: "userId",
      },
      to: {
        table: "user",
        column: "id",
      },
      type: "one",
    })
    .addTable("one_time_token", (t) => {
      return t
        .addColumn("id", idColumn())
        .addColumn("userId", referenceColumn())
        .addColumn("token", column("string"))
        .addColumn("type", column("string"))
        .addColumn("expiresAt", column("timestamp"))
        .addColumn(
          "createdAt",
          column("timestamp").defaultTo((b) => b.now()),
        )
        .createIndex("idx_ott_token", ["token"], { unique: true })
        .createIndex("idx_ott_user_type", ["userId", "type"])
        .createIndex("idx_expires_at", ["expiresAt"]);
    })
    .addReference("tokenOwner", {
      from: {
        table: "one_time_token",
        column: "userId",
      },
      to: {
        table: "user",
        column: "id",
      },
      type: "one",
    });
});
