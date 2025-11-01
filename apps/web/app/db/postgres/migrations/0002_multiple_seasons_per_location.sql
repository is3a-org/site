ALTER TABLE "location" ADD COLUMN "seasonSummer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "seasonAutumn" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "seasonWinter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "seasonSpring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "location" DROP COLUMN "seasons";--> statement-breakpoint
DROP TYPE "public"."season";