CREATE TABLE "kb_file_ingestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ingested_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kb_file_ingestions" ADD CONSTRAINT "kb_file_ingestions_knowledge_base_id_knowledge_bases_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_file_ingestions" ADD CONSTRAINT "kb_file_ingestions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kb_file_ingestions_kb_file_idx" ON "kb_file_ingestions" USING btree ("knowledge_base_id","file_id");--> statement-breakpoint
CREATE INDEX "kb_file_ingestions_file_idx" ON "kb_file_ingestions" USING btree ("file_id");