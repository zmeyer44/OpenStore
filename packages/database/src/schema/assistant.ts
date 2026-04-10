import { randomBytes } from "node:crypto";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { users } from "./users";

/** URL-safe 16-char random ID matching the AI SDK's default nanoid length. */
function generateId(): string {
  const bytes = randomBytes(12);
  return bytes.toString("base64url").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const assistantConversations = pgTable(
  "assistant_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    model: varchar("model", { length: 80 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("assistant_conversations_workspace_idx").on(table.workspaceId),
    index("assistant_conversations_user_idx").on(table.userId),
  ],
);

export const assistantMessages = pgTable(
  "assistant_messages",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => assistantConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    parts: jsonb("parts").notNull(),
    attachments: jsonb("attachments"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("assistant_messages_conversation_idx").on(table.conversationId),
    index("assistant_messages_created_idx").on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const assistantConversationsRelations = relations(
  assistantConversations,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [assistantConversations.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [assistantConversations.userId],
      references: [users.id],
    }),
    messages: many(assistantMessages),
  }),
);

export const assistantMessagesRelations = relations(
  assistantMessages,
  ({ one }) => ({
    conversation: one(assistantConversations, {
      fields: [assistantMessages.conversationId],
      references: [assistantConversations.id],
    }),
  }),
);
