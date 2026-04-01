CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"email_verified" boolean DEFAULT false,
	"image" text,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"storage_limit" bigint DEFAULT 5368709120 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"folder_id" uuid,
	"name" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"storage_path" text NOT NULL,
	"storage_provider" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'ready' NOT NULL,
	"thumbnail_path" text,
	"checksum" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_id" uuid,
	"folder_id" uuid,
	"token" varchar(255) NOT NULL,
	"access" varchar(20) DEFAULT 'view' NOT NULL,
	"has_password" boolean DEFAULT false,
	"password_hash" text,
	"expires_at" timestamp,
	"max_downloads" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "upload_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"folder_id" uuid,
	"token" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"max_files" integer,
	"max_file_size" bigint,
	"allowed_mime_types" jsonb,
	"files_uploaded" integer DEFAULT 0 NOT NULL,
	"has_password" boolean DEFAULT false,
	"password_hash" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_user_id_idx" ON "files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "files_folder_id_idx" ON "files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "files_user_folder_idx" ON "files" USING btree ("user_id","folder_id");--> statement-breakpoint
CREATE INDEX "folders_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folders_parent_id_idx" ON "folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "folders_user_parent_idx" ON "folders" USING btree ("user_id","parent_id");--> statement-breakpoint
CREATE INDEX "share_links_token_idx" ON "share_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "share_links_user_id_idx" ON "share_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "share_links_file_id_idx" ON "share_links" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "share_links_folder_id_idx" ON "share_links" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "upload_links_token_idx" ON "upload_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "upload_links_user_id_idx" ON "upload_links" USING btree ("user_id");