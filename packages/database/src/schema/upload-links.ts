import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { folders } from './folders';
import { workspaces } from './workspaces';

export const uploadLinks = pgTable(
  'upload_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, {
      onDelete: 'set null',
    }),
    token: varchar('token', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    maxFiles: integer('max_files'),
    maxFileSize: bigint('max_file_size', { mode: 'number' }),
    allowedMimeTypes: jsonb('allowed_mime_types').$type<string[]>(),
    filesUploaded: integer('files_uploaded').default(0).notNull(),
    hasPassword: boolean('has_password').default(false),
    passwordHash: text('password_hash'),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('upload_links_token_idx').on(table.token),
    index('upload_links_workspace_id_idx').on(table.workspaceId),
    index('upload_links_user_id_idx').on(table.userId),
  ],
);

export const uploadLinksRelations = relations(uploadLinks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [uploadLinks.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [uploadLinks.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [uploadLinks.folderId],
    references: [folders.id],
  }),
}));
