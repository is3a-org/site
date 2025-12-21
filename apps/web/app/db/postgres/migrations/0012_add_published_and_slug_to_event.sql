ALTER TABLE "event" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_slug_unique" UNIQUE("slug");