-- Create new workspace tables
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"owner_id" text NOT NULL,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"storage_limit" bigint DEFAULT 5368709120 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"token" varchar(255) NOT NULL,
	"invited_by_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add workspace_id columns as NULLABLE first (will be made NOT NULL after data migration)
DROP INDEX "files_user_folder_idx";--> statement-breakpoint
DROP INDEX "folders_user_parent_idx";--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "share_links" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "upload_links" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint

-- Workspace table constraints
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Indexes for new tables
CREATE UNIQUE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_user_workspace_idx" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invites_token_idx" ON "workspace_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "workspace_invites_workspace_id_idx" ON "workspace_invites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invites_email_idx" ON "workspace_invites" USING btree ("email");--> statement-breakpoint

-- Migrate existing data: create a workspace for each user and assign their data
DO $$
DECLARE
  u RECORD;
  ws_id uuid;
  slug_val text;
  counter int := 0;
BEGIN
  FOR u IN SELECT id, name, email, storage_used, storage_limit FROM users LOOP
    counter := counter + 1;
    -- Generate slug from name or email
    slug_val := lower(regexp_replace(coalesce(u.name, split_part(u.email, '@', 1)), '[^a-z0-9]+', '-', 'gi'));
    slug_val := trim(both '-' from slug_val);
    IF slug_val = '' THEN slug_val := 'workspace'; END IF;
    -- Append counter to ensure uniqueness
    slug_val := slug_val || '-' || counter;

    -- Create workspace
    INSERT INTO workspaces (id, name, slug, owner_id, storage_used, storage_limit)
    VALUES (gen_random_uuid(), coalesce(u.name, split_part(u.email, '@', 1)) || '''s Workspace', slug_val, u.id, coalesce(u.storage_used, 0), coalesce(u.storage_limit, 5368709120))
    RETURNING id INTO ws_id;

    -- Add user as owner
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, u.id, 'owner');

    -- Migrate existing data
    UPDATE files SET workspace_id = ws_id WHERE user_id = u.id;
    UPDATE folders SET workspace_id = ws_id WHERE user_id = u.id;
    UPDATE share_links SET workspace_id = ws_id WHERE user_id = u.id;
    UPDATE upload_links SET workspace_id = ws_id WHERE user_id = u.id;
  END LOOP;
END $$;--> statement-breakpoint

-- Now make workspace_id NOT NULL and add FK constraints
ALTER TABLE "files" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_links" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "upload_links" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_links" ADD CONSTRAINT "upload_links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes on existing tables
CREATE INDEX "files_workspace_id_idx" ON "files" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "files_workspace_folder_idx" ON "files" USING btree ("workspace_id","folder_id");--> statement-breakpoint
CREATE INDEX "folders_workspace_id_idx" ON "folders" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "folders_workspace_parent_idx" ON "folders" USING btree ("workspace_id","parent_id");--> statement-breakpoint
CREATE INDEX "share_links_workspace_id_idx" ON "share_links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "upload_links_workspace_id_idx" ON "upload_links" USING btree ("workspace_id");
