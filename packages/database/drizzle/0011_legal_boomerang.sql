ALTER TABLE "tags" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
UPDATE "tags" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM("name"), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "tags" SET "slug" = 'tag' WHERE "slug" = '' OR "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tags_workspace_slug_idx" ON "tags" USING btree ("workspace_id","slug");
