-- Migration: Convert knowledge_bases <-> tags from one-to-one to many-to-many
-- via a new kb_tags join table.

-- 1. Create the kb_tags join table
CREATE TABLE IF NOT EXISTS "kb_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- 2. Migrate existing tag associations into the join table
INSERT INTO "kb_tags" ("knowledge_base_id", "tag_id", "created_at")
SELECT "id", "tag_id", "created_at"
FROM "knowledge_bases"
WHERE "tag_id" IS NOT NULL;
--> statement-breakpoint

-- 3. Drop the old unique index and foreign key on knowledge_bases.tag_id
DROP INDEX IF EXISTS "knowledge_bases_workspace_tag_idx";
--> statement-breakpoint
ALTER TABLE "knowledge_bases" DROP CONSTRAINT IF EXISTS "knowledge_bases_tag_id_tags_id_fk";
--> statement-breakpoint

-- 4. Drop the tag_id column from knowledge_bases
ALTER TABLE "knowledge_bases" DROP COLUMN IF EXISTS "tag_id";
--> statement-breakpoint

-- 5. Add indexes and constraints to kb_tags
CREATE UNIQUE INDEX "kb_tags_kb_tag_idx" ON "kb_tags" USING btree ("knowledge_base_id","tag_id");
--> statement-breakpoint
CREATE INDEX "kb_tags_kb_idx" ON "kb_tags" USING btree ("knowledge_base_id");
--> statement-breakpoint
CREATE INDEX "kb_tags_tag_idx" ON "kb_tags" USING btree ("tag_id");
--> statement-breakpoint

-- 6. Add foreign keys
ALTER TABLE "kb_tags" ADD CONSTRAINT "kb_tags_knowledge_base_id_knowledge_bases_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kb_tags" ADD CONSTRAINT "kb_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
