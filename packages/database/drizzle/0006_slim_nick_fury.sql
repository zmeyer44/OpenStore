ALTER TABLE "plugin_invocation_logs" DROP CONSTRAINT "plugin_invocation_logs_actor_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "plugin_registry_entries" DROP CONSTRAINT "plugin_registry_entries_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_plugins" DROP CONSTRAINT "workspace_plugins_installed_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "plugin_invocation_logs" ALTER COLUMN "actor_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin_registry_entries" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_plugins" ALTER COLUMN "installed_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin_invocation_logs" ADD CONSTRAINT "plugin_invocation_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_registry_entries" ADD CONSTRAINT "plugin_registry_entries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_plugins" ADD CONSTRAINT "workspace_plugins_installed_by_id_users_id_fk" FOREIGN KEY ("installed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;