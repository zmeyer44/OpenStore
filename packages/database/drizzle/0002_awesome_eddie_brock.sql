CREATE TABLE "s3_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"access_key_id" varchar(64) NOT NULL,
	"encrypted_secret" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"permissions" varchar(20) DEFAULT 'readwrite' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "s3_key" text;--> statement-breakpoint
ALTER TABLE "s3_api_keys" ADD CONSTRAINT "s3_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "s3_api_keys" ADD CONSTRAINT "s3_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "s3_api_keys_access_key_id_idx" ON "s3_api_keys" USING btree ("access_key_id");--> statement-breakpoint
CREATE INDEX "s3_api_keys_workspace_id_idx" ON "s3_api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "files_workspace_s3key_idx" ON "files" USING btree ("workspace_id","s3_key");