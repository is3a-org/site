ALTER TABLE "one_time_token_one_time_password_db" RENAME TO "one_time_token_one-time-password-db";--> statement-breakpoint
ALTER TABLE "session_simple_auth_db" RENAME TO "session_simple-auth-db";--> statement-breakpoint
ALTER TABLE "totp_secret_one_time_password_db" RENAME TO "totp_secret_one-time-password-db";--> statement-breakpoint
ALTER TABLE "user_simple_auth_db" RENAME TO "user_simple-auth-db";--> statement-breakpoint
ALTER TABLE "user_stripe" DROP CONSTRAINT "user_stripe_userId_user_simple_auth_db_id_fk";
--> statement-breakpoint
ALTER TABLE "user_stripe" ADD CONSTRAINT "user_stripe_userId_user_simple-auth-db_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_simple-auth-db"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "session_simple-auth-db" ADD CONSTRAINT "fk_session_user_sessionOwner_simple-auth-db" FOREIGN KEY ("userId") REFERENCES "public"."user_simple-auth-db"("_internalId") ON DELETE no action ON UPDATE no action;