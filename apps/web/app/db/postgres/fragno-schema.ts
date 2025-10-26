import {
  pgTable,
  varchar,
  text,
  bigserial,
  integer,
  uniqueIndex,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@fragno-dev/db/id";

// ============================================================================
// Settings Table (shared across all fragments)
// ============================================================================

export const fragno_db_settings = pgTable(
  "fragno_db_settings",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    key: text("key").notNull(),
    value: text("value").notNull(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [uniqueIndex("unique_key").on(table.key)],
);

export const fragnoDbSettingSchemaVersion = 1;

// ============================================================================
// Fragment: simple-auth-db
// ============================================================================

export const user_simple_auth_db = pgTable(
  "user_simple-auth-db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    passwordHash: text("passwordHash").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [index("idx_user_email_simple-auth-db").on(table.email)],
);

export const session_simple_auth_db = pgTable(
  "session_simple-auth-db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [index("idx_session_user_simple-auth-db").on(table.userId)],
);

export const simple_auth_db_schema = {
  "user_simple-auth-db": user_simple_auth_db,
  user: user_simple_auth_db,
  "session_simple-auth-db": session_simple_auth_db,
  session: session_simple_auth_db,
  schemaVersion: 2,
};
