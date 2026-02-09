CREATE TABLE "fragno_db_outbox" (
	"id" varchar(30) NOT NULL,
	"versionstamp" text NOT NULL,
	"uowId" text NOT NULL,
	"payload" json NOT NULL,
	"refMap" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "fragno_db_outbox_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "forms";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "otp";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "stripe";
--> statement-breakpoint
ALTER TABLE "public"."form_forms" SET SCHEMA "forms";
--> statement-breakpoint
ALTER TABLE "public"."one_time_token_one-time-password-db" SET SCHEMA "otp";
--> statement-breakpoint
ALTER TABLE "public"."response_forms" SET SCHEMA "forms";
--> statement-breakpoint
ALTER TABLE "public"."session_simple-auth-db" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."subscription_stripe" SET SCHEMA "stripe";
--> statement-breakpoint
ALTER TABLE "public"."totp_secret_one-time-password-db" SET SCHEMA "otp";
--> statement-breakpoint
ALTER TABLE "public"."user_simple-auth-db" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "forms"."form_forms" RENAME TO "form";
--> statement-breakpoint
ALTER TABLE "otp"."one_time_token_one-time-password-db" RENAME TO "one_time_token";
--> statement-breakpoint
ALTER TABLE "forms"."response_forms" RENAME TO "response";
--> statement-breakpoint
ALTER TABLE "auth"."session_simple-auth-db" RENAME TO "session";
--> statement-breakpoint
ALTER TABLE "stripe"."subscription_stripe" RENAME TO "subscription";
--> statement-breakpoint
ALTER TABLE "otp"."totp_secret_one-time-password-db" RENAME TO "totp_secret";
--> statement-breakpoint
ALTER TABLE "auth"."user_simple-auth-db" RENAME TO "user";
--> statement-breakpoint
ALTER TABLE "user_stripe" DROP CONSTRAINT "user_stripe_userId_user_simple-auth-db_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."session" DROP CONSTRAINT "fk_session_user_sessionOwner_simple-auth-db";
--> statement-breakpoint
DROP INDEX "forms"."idx_form_status_forms";
--> statement-breakpoint
DROP INDEX "forms"."idx_form_slug_forms";
--> statement-breakpoint
DROP INDEX "otp"."idx_ott_token_one-time-password-db";
--> statement-breakpoint
DROP INDEX "otp"."idx_ott_user_type_one-time-password-db";
--> statement-breakpoint
DROP INDEX "otp"."idx_expires_at_one-time-password-db";
--> statement-breakpoint
DROP INDEX "forms"."idx_response_form_forms";
--> statement-breakpoint
DROP INDEX "forms"."idx_response_submitted_at_forms";
--> statement-breakpoint
DROP INDEX "auth"."idx_session_user_simple-auth-db";
--> statement-breakpoint
DROP INDEX "stripe"."idx_stripe_customer_id_stripe";
--> statement-breakpoint
DROP INDEX "stripe"."idx_stripe_subscription_id_stripe";
--> statement-breakpoint
DROP INDEX "stripe"."idx_reference_id_stripe";
--> statement-breakpoint
DROP INDEX "otp"."idx_totp_user_one-time-password-db";
--> statement-breakpoint
DROP INDEX "auth"."idx_user_email_simple-auth-db";
--> statement-breakpoint
DROP INDEX "auth"."idx_user_id_simple-auth-db";
--> statement-breakpoint
DROP INDEX "auth"."idx_user_createdAt_simple-auth-db";
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_outbox_versionstamp" ON "fragno_db_outbox" USING btree ("versionstamp");
--> statement-breakpoint
CREATE INDEX "idx_outbox_uow" ON "fragno_db_outbox" USING btree ("uowId");
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD CONSTRAINT "user_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "user_stripe" ADD CONSTRAINT "user_stripe_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "fk_session_user_sessionOwner" FOREIGN KEY ("userId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_form_status" ON "forms"."form" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_form_slug" ON "forms"."form" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ott_token" ON "otp"."one_time_token" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "idx_ott_user_type" ON "otp"."one_time_token" USING btree ("userId","type");
--> statement-breakpoint
CREATE INDEX "idx_expires_at" ON "otp"."one_time_token" USING btree ("expiresAt");
--> statement-breakpoint
CREATE INDEX "idx_response_form" ON "forms"."response" USING btree ("formId");
--> statement-breakpoint
CREATE INDEX "idx_response_submitted_at" ON "forms"."response" USING btree ("submittedAt");
--> statement-breakpoint
CREATE INDEX "idx_session_user" ON "auth"."session" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "idx_stripe_customer_id" ON "stripe"."subscription" USING btree ("stripeCustomerId");
--> statement-breakpoint
CREATE INDEX "idx_stripe_subscription_id" ON "stripe"."subscription" USING btree ("stripeSubscriptionId");
--> statement-breakpoint
CREATE INDEX "idx_reference_id" ON "stripe"."subscription" USING btree ("referenceId");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_totp_user" ON "otp"."totp_secret" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "auth"."user" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_id" ON "auth"."user" USING btree ("id");
--> statement-breakpoint
CREATE INDEX "idx_user_createdAt" ON "auth"."user" USING btree ("createdAt");
--> statement-breakpoint
ALTER TABLE "forms"."form" ADD CONSTRAINT "form_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "fragno_db_settings" ADD CONSTRAINT "fragno_db_settings_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "fragno_hooks" ADD CONSTRAINT "fragno_hooks_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "otp"."one_time_token" ADD CONSTRAINT "one_time_token_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "forms"."response" ADD CONSTRAINT "response_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "stripe"."subscription" ADD CONSTRAINT "subscription_id_unique" UNIQUE("id");
--> statement-breakpoint
ALTER TABLE "otp"."totp_secret" ADD CONSTRAINT "totp_secret_id_unique" UNIQUE("id");