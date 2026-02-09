import {
  pgTable,
  varchar,
  text,
  bigserial,
  integer,
  uniqueIndex,
  json,
  timestamp,
  index,
  pgSchema,
  bigint,
  foreignKey,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@fragno-dev/db/id";
import { relations } from "drizzle-orm";

// ============================================================================
// Fragment: (none)
// ============================================================================

export const fragno_db_settings = pgTable(
  "fragno_db_settings",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    key: text("key").notNull(),
    value: text("value").notNull(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [uniqueIndex("unique_key").on(table.key)],
);

export const fragno_hooks = pgTable(
  "fragno_hooks",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    namespace: text("namespace").notNull(),
    hookName: text("hookName").notNull(),
    payload: json("payload").notNull(),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("maxAttempts").notNull().default(5),
    lastAttemptAt: timestamp("lastAttemptAt"),
    nextRetryAt: timestamp("nextRetryAt"),
    error: text("error"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    nonce: text("nonce").notNull(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_namespace_status_retry").on(table.namespace, table.status, table.nextRetryAt),
    index("idx_nonce").on(table.nonce),
  ],
);

export const fragno_db_outbox = pgTable(
  "fragno_db_outbox",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    versionstamp: text("versionstamp").notNull(),
    uowId: text("uowId").notNull(),
    payload: json("payload").notNull(),
    refMap: json("refMap"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    uniqueIndex("idx_outbox_versionstamp").on(table.versionstamp),
    index("idx_outbox_uow").on(table.uowId),
  ],
);

// ============================================================================
// Fragment: auth
// ============================================================================

const schema_auth = pgSchema("auth");

export const user_auth = schema_auth.table(
  "user",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_user_email").on(table.email),
    uniqueIndex("idx_user_id").on(table.id),
    index("idx_user_createdAt").on(table.createdAt),
  ],
);

export const session_auth = schema_auth.table(
  "session",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
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
      foreignColumns: [user_auth._internalId],
      name: "fk_session_user_sessionOwner",
    }),
    index("idx_session_user").on(table.userId),
  ],
);

export const user_authRelations = relations(user_auth, ({ many }) => ({
  sessionList: many(session_auth, {
    relationName: "session_user",
  }),
}));

export const session_authRelations = relations(session_auth, ({ one }) => ({
  sessionOwner: one(user_auth, {
    relationName: "session_user",
    fields: [session_auth.userId],
    references: [user_auth._internalId],
  }),
}));

export const auth_schema = {
  user_auth: user_auth,
  user_authRelations: user_authRelations,
  user: user_auth,
  userRelations: user_authRelations,
  session_auth: session_auth,
  session_authRelations: session_authRelations,
  session: session_auth,
  sessionRelations: session_authRelations,
  schemaVersion: 4,
};

// ============================================================================
// Fragment: otp
// ============================================================================

const schema_otp = pgSchema("otp");

export const totp_secret_otp = schema_otp.table(
  "totp_secret",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [uniqueIndex("idx_totp_user").on(table.userId)],
);

export const one_time_token_otp = schema_otp.table(
  "one_time_token",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
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
    uniqueIndex("idx_ott_token").on(table.token),
    index("idx_ott_user_type").on(table.userId, table.type),
    index("idx_expires_at").on(table.expiresAt),
  ],
);

export const otp_schema = {
  totp_secret_otp: totp_secret_otp,
  totp_secret: totp_secret_otp,
  one_time_token_otp: one_time_token_otp,
  one_time_token: one_time_token_otp,
  schemaVersion: 2,
};

// ============================================================================
// Fragment: stripe
// ============================================================================

const schema_stripe = pgSchema("stripe");

export const subscription_stripe = schema_stripe.table(
  "subscription",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
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
    index("idx_stripe_customer_id").on(table.stripeCustomerId),
    index("idx_stripe_subscription_id").on(table.stripeSubscriptionId),
    index("idx_reference_id").on(table.referenceId),
  ],
);

export const stripe_schema = {
  subscription_stripe: subscription_stripe,
  subscription: subscription_stripe,
  schemaVersion: 1,
};

// ============================================================================
// Fragment: forms
// ============================================================================

const schema_forms = pgSchema("forms");

export const form_forms = schema_forms.table(
  "form",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    dataSchema: json("dataSchema").notNull(),
    uiSchema: json("uiSchema"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_form_status").on(table.status),
    uniqueIndex("idx_form_slug").on(table.slug),
  ],
);

export const response_forms = schema_forms.table(
  "response",
  {
    id: varchar("id", { length: 30 })
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    formId: text("formId").notNull(),
    formVersion: integer("formVersion").notNull(),
    data: json("data").notNull(),
    submittedAt: timestamp("submittedAt").notNull().defaultNow(),
    userAgent: text("userAgent"),
    ip: text("ip"),
    _internalId: bigserial("_internalId", { mode: "number" }).primaryKey().notNull(),
    _version: integer("_version").notNull().default(0),
  },
  (table) => [
    index("idx_response_form").on(table.formId),
    index("idx_response_submitted_at").on(table.submittedAt),
  ],
);

export const forms_schema = {
  form_forms: form_forms,
  form: form_forms,
  response_forms: response_forms,
  response: response_forms,
  schemaVersion: 2,
};
