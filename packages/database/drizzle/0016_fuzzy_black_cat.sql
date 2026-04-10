CREATE TABLE "assistant_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255),
	"model" varchar(80),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"parts" jsonb NOT NULL,
	"attachments" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assistant_conversations_workspace_idx" ON "assistant_conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "assistant_conversations_user_idx" ON "assistant_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assistant_messages_conversation_idx" ON "assistant_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "assistant_messages_created_idx" ON "assistant_messages" USING btree ("created_at");
