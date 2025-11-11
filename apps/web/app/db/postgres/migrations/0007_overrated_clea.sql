ALTER TABLE "user_simple_auth_db" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;

-- Safely grant admin role if the users exist
UPDATE "user_simple_auth_db"
SET "role" = 'admin'
WHERE "email" IN ('jan.o.schutte@gmail.com', 'mick@is3a.nl', 'jan@is3a.nl', 'kjeld@is3a.nl', 'wilco@is3a.nl', 'lorian@is3a.nl');
