ALTER TABLE "event" RENAME COLUMN "speakerContent" TO "speakerAbstract";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "speakerSummary" text;