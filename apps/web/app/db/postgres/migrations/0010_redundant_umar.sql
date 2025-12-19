CREATE TABLE "fragno_hooks" (
	"id" varchar(30) NOT NULL,
	"namespace" text NOT NULL,
	"hookName" text NOT NULL,
	"payload" json NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 5 NOT NULL,
	"lastAttemptAt" timestamp,
	"nextRetryAt" timestamp,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"nonce" text NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_namespace_status_retry" ON "fragno_hooks" USING btree ("namespace","status","nextRetryAt");--> statement-breakpoint
CREATE INDEX "idx_nonce" ON "fragno_hooks" USING btree ("nonce");