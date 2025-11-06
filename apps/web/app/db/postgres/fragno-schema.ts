import {
  pgTable,
  varchar,
  text,
  bigserial,
  integer,
  uniqueIndex,
  timestamp,
  index,
  bigint,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createId } from "@fragno-dev/db/id";
import { relations } from "drizzle-orm";

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
  "user_simple_auth_db",
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
  "session_simple_auth_db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: bigint("userId", { mode: "number" }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user_simple_auth_db._internalId],
      name: "fk_session_user_sessionOwner_simple_auth_db",
    }),
    index("idx_session_user_simple-auth-db").on(table.userId),
  ],
);

export const totp_secret_simple_auth_db = pgTable(
  "totp_secret_simple_auth_db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: bigint("userId", { mode: "number" }).notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user_simple_auth_db._internalId],
      name: "fk_totp_secret_user_totpOwner_simple_auth_db",
    }),
    uniqueIndex("idx_totp_user_simple-auth-db").on(table.userId),
  ],
);

export const one_time_token_simple_auth_db = pgTable(
  "one_time_token_simple_auth_db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: bigint("userId", { mode: "number" }).notNull(),
    token: text("token").notNull(),
    type: text("type").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user_simple_auth_db._internalId],
      name: "fk_one_time_token_user_tokenOwner_simple_auth_db",
    }),
    uniqueIndex("idx_ott_token_simple-auth-db").on(table.token),
    index("idx_ott_user_type_simple-auth-db").on(table.userId, table.type),
    index("idx_expires_at_simple-auth-db").on(table.expiresAt),
  ],
);

export const user_simple_auth_dbRelations = relations(user_simple_auth_db, ({ many }) => ({
  sessionList: many(session_simple_auth_db, {
    relationName: "session_user",
  }),
  totp_secretList: many(totp_secret_simple_auth_db, {
    relationName: "totp_secret_user",
  }),
  one_time_tokenList: many(one_time_token_simple_auth_db, {
    relationName: "one_time_token_user",
  }),
}));

export const session_simple_auth_dbRelations = relations(session_simple_auth_db, ({ one }) => ({
  sessionOwner: one(user_simple_auth_db, {
    relationName: "session_user",
    fields: [session_simple_auth_db.userId],
    references: [user_simple_auth_db._internalId],
  }),
}));

export const totp_secret_simple_auth_dbRelations = relations(
  totp_secret_simple_auth_db,
  ({ one }) => ({
    totpOwner: one(user_simple_auth_db, {
      relationName: "totp_secret_user",
      fields: [totp_secret_simple_auth_db.userId],
      references: [user_simple_auth_db._internalId],
    }),
  }),
);

export const one_time_token_simple_auth_dbRelations = relations(
  one_time_token_simple_auth_db,
  ({ one }) => ({
    tokenOwner: one(user_simple_auth_db, {
      relationName: "one_time_token_user",
      fields: [one_time_token_simple_auth_db.userId],
      references: [user_simple_auth_db._internalId],
    }),
  }),
);

export const simple_auth_db_schema = {
  user_simple_auth_db: user_simple_auth_db,
  user_simple_auth_dbRelations: user_simple_auth_dbRelations,
  user: user_simple_auth_db,
  userRelations: user_simple_auth_dbRelations,
  session_simple_auth_db: session_simple_auth_db,
  session_simple_auth_dbRelations: session_simple_auth_dbRelations,
  session: session_simple_auth_db,
  sessionRelations: session_simple_auth_dbRelations,
  totp_secret_simple_auth_db: totp_secret_simple_auth_db,
  totp_secret_simple_auth_dbRelations: totp_secret_simple_auth_dbRelations,
  totp_secret: totp_secret_simple_auth_db,
  totp_secretRelations: totp_secret_simple_auth_dbRelations,
  one_time_token_simple_auth_db: one_time_token_simple_auth_db,
  one_time_token_simple_auth_dbRelations: one_time_token_simple_auth_dbRelations,
  one_time_token: one_time_token_simple_auth_db,
  one_time_tokenRelations: one_time_token_simple_auth_dbRelations,
  schemaVersion: 7,
};
