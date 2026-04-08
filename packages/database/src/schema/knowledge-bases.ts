import { randomBytes } from "node:crypto";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { tags } from "./tags";
import { files } from "./files";

/** URL-safe 16-char random ID matching the AI SDK's default nanoid length. */
function generateId(): string {
  const bytes = randomBytes(12);
  return bytes.toString("base64url").slice(0, 16);
}

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    schemaPrompt: text("schema_prompt").notNull().default(""),
    model: varchar("model", { length: 80 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    lastIngestedAt: timestamp("last_ingested_at"),
    lastLintedAt: timestamp("last_linted_at"),
    wikiStoragePath: text("wiki_storage_path").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_bases_workspace_idx").on(table.workspaceId),
    uniqueIndex("knowledge_bases_workspace_tag_idx").on(
      table.workspaceId,
      table.tagId,
    ),
  ],
);

export const kbConversations = pgTable(
  "kb_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("kb_conversations_kb_idx").on(table.knowledgeBaseId),
    index("kb_conversations_user_idx").on(table.userId),
  ],
);

export const kbMessages = pgTable(
  "kb_messages",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => kbConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    parts: jsonb("parts").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("kb_messages_conversation_idx").on(table.conversationId),
    index("kb_messages_created_idx").on(table.createdAt),
  ],
);

export const kbFileIngestions = pgTable(
  "kb_file_ingestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    ingestedAt: timestamp("ingested_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("kb_file_ingestions_kb_file_idx").on(
      table.knowledgeBaseId,
      table.fileId,
    ),
    index("kb_file_ingestions_file_idx").on(table.fileId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const knowledgeBasesRelations = relations(
  knowledgeBases,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [knowledgeBases.workspaceId],
      references: [workspaces.id],
    }),
    tag: one(tags, {
      fields: [knowledgeBases.tagId],
      references: [tags.id],
    }),
    createdBy: one(users, {
      fields: [knowledgeBases.createdById],
      references: [users.id],
    }),
    conversations: many(kbConversations),
  }),
);

export const kbConversationsRelations = relations(
  kbConversations,
  ({ one, many }) => ({
    knowledgeBase: one(knowledgeBases, {
      fields: [kbConversations.knowledgeBaseId],
      references: [knowledgeBases.id],
    }),
    user: one(users, {
      fields: [kbConversations.userId],
      references: [users.id],
    }),
    messages: many(kbMessages),
  }),
);

export const kbMessagesRelations = relations(kbMessages, ({ one }) => ({
  conversation: one(kbConversations, {
    fields: [kbMessages.conversationId],
    references: [kbConversations.id],
  }),
}));

export const kbFileIngestionsRelations = relations(
  kbFileIngestions,
  ({ one }) => ({
    knowledgeBase: one(knowledgeBases, {
      fields: [kbFileIngestions.knowledgeBaseId],
      references: [knowledgeBases.id],
    }),
    file: one(files, {
      fields: [kbFileIngestions.fileId],
      references: [files.id],
    }),
  }),
);
