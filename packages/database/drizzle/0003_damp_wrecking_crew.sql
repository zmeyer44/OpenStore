CREATE TABLE "s3_multipart_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" varchar(128) NOT NULL,
	"part_number" integer NOT NULL,
	"storage_path" text NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"etag" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "s3_multipart_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"upload_id" varchar(128) NOT NULL,
	"s3_key" text NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"user_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "s3_multipart_uploads" ADD CONSTRAINT "s3_multipart_uploads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "s3_multipart_parts_upload_part_idx" ON "s3_multipart_parts" USING btree ("upload_id","part_number");--> statement-breakpoint
CREATE INDEX "s3_multipart_parts_upload_id_idx" ON "s3_multipart_parts" USING btree ("upload_id");--> statement-breakpoint
CREATE UNIQUE INDEX "s3_multipart_upload_id_idx" ON "s3_multipart_uploads" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "s3_multipart_workspace_status_idx" ON "s3_multipart_uploads" USING btree ("workspace_id","status");