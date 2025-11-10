CREATE TABLE "one_time_token_one_time_password_db" (
	"id" varchar(30) NOT NULL,
	"userId" bigint NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "totp_secret_one_time_password_db" (
	"id" varchar(30) NOT NULL,
	"userId" bigint NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ott_token_one-time-password-db" ON "one_time_token_one_time_password_db" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_ott_user_type_one-time-password-db" ON "one_time_token_one_time_password_db" USING btree ("userId","type");--> statement-breakpoint
CREATE INDEX "idx_expires_at_one-time-password-db" ON "one_time_token_one_time_password_db" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_totp_user_one-time-password-db" ON "totp_secret_one_time_password_db" USING btree ("userId");