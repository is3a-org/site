-- Fragno canary upgrade. Hand-edited after drizzle-kit generate:
-- * Fragno now declares indexable strings as varchar(191) (a MySQL index limit). Existing text
--   columns stay text: Postgres gains nothing from the limit, existing values (form descriptions)
--   could fail it, and forms accepts user agents up to 512 characters. The snapshot still says
--   varchar(191); the database is wider, which every Fragno write fits.
-- * stripe.subscription is recreated instead of altered, see below.
CREATE TABLE "stripe"."customer" (
	"id" varchar(128) NOT NULL,
	"referenceId" varchar(191) NOT NULL,
	"linkedAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "customer_id_unique" UNIQUE("id")
);
--> statement-breakpoint
-- Stripe fragment v2 keys subscriptions by their Stripe ID and has no upgrade path from v1, so the
-- table is recreated. On startup StripeFragmentDurableObject links the customers in user_stripe to
-- the fragment, which syncs their subscriptions back from Stripe.
DROP TABLE "stripe"."subscription";
--> statement-breakpoint
CREATE TABLE "stripe"."subscription" (
	"id" varchar(128) NOT NULL,
	"customerId" varchar(191) NOT NULL,
	"referenceId" varchar(191),
	"itemId" varchar(191) NOT NULL,
	"priceId" varchar(191) NOT NULL,
	"quantity" integer,
	"status" varchar(191) NOT NULL,
	"currentPeriodStart" timestamp NOT NULL,
	"currentPeriodEnd" timestamp NOT NULL,
	"trialStart" timestamp,
	"trialEnd" timestamp,
	"cancelAtPeriodEnd" boolean NOT NULL,
	"cancelAt" timestamp,
	"canceledAt" timestamp,
	"endedAt" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "subscription_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE INDEX "idx_subscription_customer_id" ON "stripe"."subscription" USING btree ("customerId");
--> statement-breakpoint
CREATE INDEX "idx_subscription_reference_id" ON "stripe"."subscription" USING btree ("referenceId");
--> statement-breakpoint
CREATE TABLE "fragno_db_outbox_mutations" (
	"id" varchar(128) NOT NULL,
	"entryVersionstamp" varchar(191) NOT NULL,
	"mutationVersionstamp" varchar(191) NOT NULL,
	"uowId" varchar(191) NOT NULL,
	"schema" varchar(191) NOT NULL,
	"table" varchar(191) NOT NULL,
	"externalId" varchar(191),
	"op" varchar(191) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	"payload" json NOT NULL,
	CONSTRAINT "fragno_db_outbox_mutations_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "fragno_db_sync_requests" (
	"id" varchar(128) NOT NULL,
	"requestId" varchar(191) NOT NULL,
	"status" varchar(191) NOT NULL,
	"confirmedCommandIds" json NOT NULL,
	"conflictCommandId" varchar(191),
	"baseVersionstamp" varchar(191),
	"lastVersionstamp" varchar(191),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "fragno_db_sync_requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."oauthAccount" (
	"id" varchar(128) NOT NULL,
	"userId" bigint NOT NULL,
	"provider" varchar(191) NOT NULL,
	"providerAccountId" varchar(191) NOT NULL,
	"email" text,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"tokenType" varchar(191),
	"tokenExpiresAt" timestamp,
	"scopes" json,
	"rawProfile" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "oauthAccount_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."oauthState" (
	"id" varchar(128) NOT NULL,
	"provider" varchar(191) NOT NULL,
	"state" varchar(191) NOT NULL,
	"codeVerifier" varchar(191),
	"redirectUri" text,
	"returnTo" text,
	"linkUserId" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	"sessionSeed" json,
	CONSTRAINT "oauthState_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."organizationInvitation" (
	"id" varchar(128) NOT NULL,
	"organizationId" bigint NOT NULL,
	"email" varchar(191) NOT NULL,
	"roles" json NOT NULL,
	"status" varchar(191) NOT NULL,
	"token" varchar(191) NOT NULL,
	"inviterId" bigint NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "organizationInvitation_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."organizationMemberRole" (
	"id" varchar(128) NOT NULL,
	"memberId" bigint NOT NULL,
	"role" varchar(191) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "organizationMemberRole_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."organizationMember" (
	"id" varchar(128) NOT NULL,
	"organizationId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "organizationMember_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "auth"."organization" (
	"id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(191) NOT NULL,
	"logoUrl" text,
	"metadata" json,
	"createdBy" bigint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	"_internalId" bigserial PRIMARY KEY NOT NULL,
	"_version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "organization_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "auth"."session" DROP CONSTRAINT "fk_session_user_sessionOwner";
--> statement-breakpoint
DROP INDEX "forms"."idx_response_form";
--> statement-breakpoint
DROP INDEX "forms"."idx_response_submitted_at";
--> statement-breakpoint
DROP INDEX "auth"."idx_user_email";
--> statement-breakpoint
-- Auth now trims and lowercases emails at its boundaries and looks them up exactly. Normalize the
-- stored ones so existing users can still sign in. If two accounts only differ in case, creating
-- the unique idx_user_email below fails; merge or rename one of them first.
UPDATE "auth"."user" SET "email" = lower(trim("email")) WHERE "email" <> lower(trim("email"));
--> statement-breakpoint
ALTER TABLE "forms"."form" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "forms"."form" ALTER COLUMN "status" SET DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE "fragno_db_outbox" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "fragno_db_settings" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "fragno_hooks" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "otp"."one_time_token" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "forms"."response" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "auth"."session" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "otp"."totp_secret" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "auth"."user" ALTER COLUMN "id" SET DATA TYPE varchar(128);
--> statement-breakpoint
ALTER TABLE "auth"."user" ALTER COLUMN "passwordHash" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "auth"."user" ALTER COLUMN "role" SET DEFAULT 'user';
--> statement-breakpoint
ALTER TABLE "fragno_hooks" ADD COLUMN "propagationContext" json;
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD COLUMN "activeOrganizationId" bigint;
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "bannedAt" timestamp;
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "emailVerifiedAt" timestamp;
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "emailVerificationRequestedAt" timestamp;
--> statement-breakpoint
ALTER TABLE "auth"."oauthAccount" ADD CONSTRAINT "fk_oauthAccount_user_oauthAccount_userId_fk" FOREIGN KEY ("userId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."oauthState" ADD CONSTRAINT "fk_oauthState_user_oauthState_linkUserId_fk" FOREIGN KEY ("linkUserId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organizationInvitation" ADD CONSTRAINT "fk_organizationInvitation_organization_organizationInvib469906c" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organizationInvitation" ADD CONSTRAINT "fk_organizationInvitation_user_organizationInvitation_i5d603a64" FOREIGN KEY ("inviterId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organizationMemberRole" ADD CONSTRAINT "fk_organizationMemberRole_organizationMember_organizati180d7eb6" FOREIGN KEY ("memberId") REFERENCES "auth"."organizationMember"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organizationMember" ADD CONSTRAINT "fk_organizationMember_organization_organizationMember_o606388be" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organizationMember" ADD CONSTRAINT "fk_organizationMember_user_organizationMember_userId_fk" FOREIGN KEY ("userId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."organization" ADD CONSTRAINT "fk_organization_user_organization_createdBy_fk" FOREIGN KEY ("createdBy") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customer_reference_id" ON "stripe"."customer" USING btree ("referenceId");
--> statement-breakpoint
CREATE INDEX "idx_outbox_mutations_entry" ON "fragno_db_outbox_mutations" USING btree ("entryVersionstamp");
--> statement-breakpoint
CREATE INDEX "idx_outbox_mutations_key" ON "fragno_db_outbox_mutations" USING btree ("schema","table","externalId","entryVersionstamp");
--> statement-breakpoint
CREATE INDEX "idx_outbox_mutations_uow" ON "fragno_db_outbox_mutations" USING btree ("uowId");
--> statement-breakpoint
CREATE INDEX "idx_outbox_mutations_entry_order" ON "fragno_db_outbox_mutations" USING btree ("entryVersionstamp","mutationVersionstamp");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sync_request_id" ON "fragno_db_sync_requests" USING btree ("requestId");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_account_provider_account" ON "auth"."oauthAccount" USING btree ("provider","providerAccountId");
--> statement-breakpoint
CREATE INDEX "idx_oauth_account_user" ON "auth"."oauthAccount" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "idx_oauth_account_provider" ON "auth"."oauthAccount" USING btree ("provider");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_state_state" ON "auth"."oauthState" USING btree ("state");
--> statement-breakpoint
CREATE INDEX "idx_oauth_state_provider" ON "auth"."oauthState" USING btree ("provider");
--> statement-breakpoint
CREATE INDEX "idx_oauth_state_expiresAt" ON "auth"."oauthState" USING btree ("expiresAt");
--> statement-breakpoint
CREATE INDEX "idx_oauth_state_state_expires_at" ON "auth"."oauthState" USING btree ("state","expiresAt");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_invitation_token" ON "auth"."organizationInvitation" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "idx_org_invitation_org_status" ON "auth"."organizationInvitation" USING btree ("organizationId","status");
--> statement-breakpoint
CREATE INDEX "idx_org_invitation_email" ON "auth"."organizationInvitation" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "idx_org_invitation_email_status" ON "auth"."organizationInvitation" USING btree ("email","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_member_role_member_role" ON "auth"."organizationMemberRole" USING btree ("memberId","role");
--> statement-breakpoint
CREATE INDEX "idx_org_member_role_member" ON "auth"."organizationMemberRole" USING btree ("memberId");
--> statement-breakpoint
CREATE INDEX "idx_org_member_role_role" ON "auth"."organizationMemberRole" USING btree ("role");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_member_org_user" ON "auth"."organizationMember" USING btree ("organizationId","userId");
--> statement-breakpoint
CREATE INDEX "idx_org_member_user" ON "auth"."organizationMember" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "idx_org_member_org" ON "auth"."organizationMember" USING btree ("organizationId");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_organization_slug" ON "auth"."organization" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "idx_organization_createdBy" ON "auth"."organization" USING btree ("createdBy");
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "fk_session_user_session_userId_fk" FOREIGN KEY ("userId") REFERENCES "auth"."user"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "fk_session_organization_session_activeOrganizationId_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "auth"."organization"("_internalId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_namespace_status_last_attempt" ON "fragno_hooks" USING btree ("namespace","status","lastAttemptAt");
--> statement-breakpoint
CREATE INDEX "idx_namespace_created_at" ON "fragno_hooks" USING btree ("namespace","createdAt","id");
--> statement-breakpoint
CREATE INDEX "idx_response_form_submitted_at_id" ON "forms"."response" USING btree ("formId","submittedAt","id");
--> statement-breakpoint
CREATE INDEX "idx_session_id_expiresAt" ON "auth"."session" USING btree ("id","expiresAt");
--> statement-breakpoint
CREATE INDEX "idx_user_email_verification_request" ON "auth"."user" USING btree ("email","emailVerificationRequestedAt");
--> statement-breakpoint
CREATE INDEX "idx_user_id_email_verification_request" ON "auth"."user" USING btree ("id","emailVerificationRequestedAt");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_email" ON "auth"."user" USING btree ("email");
