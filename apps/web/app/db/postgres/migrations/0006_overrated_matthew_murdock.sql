ALTER TABLE "one_time_token_one_time_password_db" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "totp_secret_one_time_password_db" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "idx_user_createdAt_simple-auth-db" ON "user_simple_auth_db" USING btree ("createdAt");