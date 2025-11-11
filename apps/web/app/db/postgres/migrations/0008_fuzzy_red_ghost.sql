CREATE TABLE "user_stripe" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(30) NOT NULL,
	"stripeCustomerId" text,
	CONSTRAINT "user_stripe_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_stripe_stripeCustomerId_unique" UNIQUE("stripeCustomerId")
);
CREATE UNIQUE INDEX "idx_user_id_simple-auth-db" ON "user_simple_auth_db" USING btree ("id");
--> statement-breakpoint
CREATE TABLE "subscription_stripe" (
	"id" varchar(30) NOT NULL,
	"referenceId" text,
	"stripePriceId" text NOT NULL,
	"stripeCustomerId" text NOT NULL,
	"stripeSubscriptionId" text NOT NULL,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"periodStart" timestamp,
	"periodEnd" timestamp,
	"trialStart" timestamp,
	"trialEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"cancelAt" timestamp,
	"seats" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_stripe" ADD CONSTRAINT "user_stripe_userId_user_simple_auth_db_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_simple_auth_db"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX "idx_stripe_customer_id_stripe" ON "subscription_stripe" USING btree ("stripeCustomerId");--> statement-breakpoint
CREATE INDEX "idx_stripe_subscription_id_stripe" ON "subscription_stripe" USING btree ("stripeSubscriptionId");--> statement-breakpoint
CREATE INDEX "idx_reference_id_stripe" ON "subscription_stripe" USING btree ("referenceId");--> statement-breakpoint
