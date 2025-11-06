import type { UpdateDeleteAction } from "drizzle-orm/pg-core";
import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  varchar,
} from "drizzle-orm/pg-core";
import {
  simple_auth_db_schema,
  one_time_password_db_schema,
  stripe_schema,
} from "./fragno-schema.ts";

const foreignKeyActions: Record<"onUpdate" | "onDelete", UpdateDeleteAction> = {
  onUpdate: "restrict",
  onDelete: "restrict",
};

export const membershipTypeEnum = pgEnum("membership_type", ["full", "flex"]);

export const location = pgTable("location", {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text(),
  address: text(),
  website: text(),
  seasonSummer: boolean().notNull().default(false),
  seasonAutumn: boolean().notNull().default(false),
  seasonWinter: boolean().notNull().default(false),
  seasonSpring: boolean().notNull().default(false),
});

export const event = pgTable("event", {
  id: serial().primaryKey(),
  name: text().notNull(),
  date: timestamp().notNull(),
  locationId: integer().references(() => location.id, foreignKeyActions),
  description: text(),
  speaker: text(),
  speakerContent: text(),
});

export const emailTemplate = pgTable("email_template", {
  id: serial().primaryKey(),
  name: text().notNull(),
  content: text(),
});

export const person = pgTable("person", {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text(),
  stripeCustomerId: text(),
});

export const membership = pgTable("membership", {
  id: serial().primaryKey(),
  personId: integer().references(() => person.id, foreignKeyActions),
  startDate: timestamp().notNull(),
  lastRenewal: timestamp(),
  nextRenewal: timestamp(),
  active: boolean().notNull().default(true),
  type: membershipTypeEnum().notNull(),
  stripeSubscriptionId: text(),
});

export const eventAttendee = pgTable("event_attendee", {
  id: serial().primaryKey(),
  eventId: integer().references(() => event.id, foreignKeyActions),
  personId: integer().references(() => person.id, foreignKeyActions),
  registeredAt: timestamp().notNull(),
  cancelled: boolean().notNull().default(false),
  cancelledAt: timestamp(),
  attended: boolean().notNull().default(false),
  amountPaid: integer().notNull(),
  plusOnes: jsonb().$type<string[]>(),
  stripeTransactionId: text(),
});

export const user_stripe = pgTable("user_stripe", {
  id: serial().primaryKey(),
  userId: varchar("userId", { length: 30 })
    .notNull()
    .references(() => simple_auth_db_schema.user.id, foreignKeyActions)
    .unique(),
  stripeCustomerId: text().unique(),
});

export const schema = {
  location,
  event,
  emailTemplate,
  person,
  membership,
  eventAttendee,
  ...simple_auth_db_schema,
  ...one_time_password_db_schema,
  ...stripe_schema,
  user_stripe,
};
