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
  boolean,
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
    role: text("role").notNull().default("user"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_user_email_simple-auth-db").on(table.email),
    uniqueIndex("idx_user_id_simple-auth-db").on(table.id),
    index("idx_user_createdAt_simple-auth-db").on(table.createdAt),
  ],
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

export const user_simple_auth_dbRelations = relations(user_simple_auth_db, ({ many }) => ({
  sessionList: many(session_simple_auth_db, {
    relationName: "session_user",
  }),
}));

export const session_simple_auth_dbRelations = relations(session_simple_auth_db, ({ one }) => ({
  sessionOwner: one(user_simple_auth_db, {
    relationName: "session_user",
    fields: [session_simple_auth_db.userId],
    references: [user_simple_auth_db._internalId],
  }),
}));

export const simple_auth_db_schema = {
  user_simple_auth_db: user_simple_auth_db,
  user_simple_auth_dbRelations: user_simple_auth_dbRelations,
  user: user_simple_auth_db,
  userRelations: user_simple_auth_dbRelations,
  session_simple_auth_db: session_simple_auth_db,
  session_simple_auth_dbRelations: session_simple_auth_dbRelations,
  session: session_simple_auth_db,
  sessionRelations: session_simple_auth_dbRelations,
  schemaVersion: 4,
};

// ============================================================================
// Fragment: one-time-password-db
// ============================================================================

export const totp_secret_one_time_password_db = pgTable(
  "totp_secret_one_time_password_db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [uniqueIndex("idx_totp_user_one-time-password-db").on(table.userId)],
);

export const one_time_token_one_time_password_db = pgTable(
  "one_time_token_one_time_password_db",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    token: text("token").notNull(),
    type: text("type").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    uniqueIndex("idx_ott_token_one-time-password-db").on(table.token),
    index("idx_ott_user_type_one-time-password-db").on(table.userId, table.type),
    index("idx_expires_at_one-time-password-db").on(table.expiresAt),
  ],
);

export const one_time_password_db_schema = {
  totp_secret_one_time_password_db: totp_secret_one_time_password_db,
  totp_secret: totp_secret_one_time_password_db,
  one_time_token_one_time_password_db: one_time_token_one_time_password_db,
  one_time_token: one_time_token_one_time_password_db,
  schemaVersion: 2,
};

// ============================================================================
// Fragment: stripe
// ============================================================================

export const subscription_stripe = pgTable(
  "subscription_stripe",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .$defaultFn(() => createId()),
    referenceId: text("referenceId"),
    stripePriceId: text("stripePriceId").notNull(),
    stripeCustomerId: text("stripeCustomerId").notNull(),
    stripeSubscriptionId: text("stripeSubscriptionId").notNull(),
    status: text("status").notNull().default("incomplete"),
    periodStart: timestamp("periodStart"),
    periodEnd: timestamp("periodEnd"),
    trialStart: timestamp("trialStart"),
    trialEnd: timestamp("trialEnd"),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
    cancelAt: timestamp("cancelAt"),
    seats: integer("seats"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_stripe_customer_id_stripe").on(table.stripeCustomerId),
    index("idx_stripe_subscription_id_stripe").on(table.stripeSubscriptionId),
    index("idx_reference_id_stripe").on(table.referenceId),
  ],
);

export const stripe_schema = {
  subscription_stripe: subscription_stripe,
  subscription: subscription_stripe,
  schemaVersion: 1,
};
