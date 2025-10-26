CREATE TYPE "public"."membership_type" AS ENUM('full', 'flex');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('summer', 'autumn', 'winter', 'spring');--> statement-breakpoint
CREATE TABLE "email_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"locationId" integer,
	"description" text,
	"speaker" text,
	"speakerContent" text
);
--> statement-breakpoint
CREATE TABLE "event_attendee" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" integer,
	"personId" integer,
	"registeredAt" timestamp NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"cancelledAt" timestamp,
	"attended" boolean DEFAULT false NOT NULL,
	"amountPaid" integer NOT NULL,
	"plusOnes" jsonb,
	"stripeTransactionId" text
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"address" text,
	"website" text,
	"seasons" "season"
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"personId" integer,
	"startDate" timestamp NOT NULL,
	"lastRenewal" timestamp,
	"nextRenewal" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"type" "membership_type" NOT NULL,
	"stripeSubscriptionId" text
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"stripeCustomerId" text
);
--> statement-breakpoint
CREATE TABLE "fragno_db_settings" (
	"id" varchar(30) NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_simple-auth-db" (
	"id" varchar(30) NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_simple-auth-db" (
	"id" varchar(30) NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_locationId_location_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."location"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "event_attendee" ADD CONSTRAINT "event_attendee_eventId_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."event"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "event_attendee" ADD CONSTRAINT "event_attendee_personId_person_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_personId_person_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_key" ON "fragno_db_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_session_user_simple-auth-db" ON "session_simple-auth-db" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_email_simple-auth-db" ON "user_simple-auth-db" USING btree ("email");