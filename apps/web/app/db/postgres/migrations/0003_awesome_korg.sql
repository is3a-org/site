CREATE TABLE "one_time_token_simple_auth_db" (
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
CREATE TABLE "totp_secret_simple_auth_db" (
	"id" varchar(30) NOT NULL,
	"userId" bigint NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "one_time_token_simple_auth_db" ADD CONSTRAINT "fk_one_time_token_user_tokenOwner_simple_auth_db" FOREIGN KEY ("userId") REFERENCES "public"."user_simple_auth_db"("_internalId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "totp_secret_simple_auth_db" ADD CONSTRAINT "fk_totp_secret_user_totpOwner_simple_auth_db" FOREIGN KEY ("userId") REFERENCES "public"."user_simple_auth_db"("_internalId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ott_token_simple-auth-db" ON "one_time_token_simple_auth_db" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_ott_user_type_simple-auth-db" ON "one_time_token_simple_auth_db" USING btree ("userId","type");--> statement-breakpoint
CREATE INDEX "idx_expires_at_simple-auth-db" ON "one_time_token_simple_auth_db" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_totp_user_simple-auth-db" ON "totp_secret_simple_auth_db" USING btree ("userId");