import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { files } from './files';
import { folders } from './folders';
import { workspaces } from './workspaces';

export const shareLinks = pgTable(
  'share_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => folders.id, {
      onDelete: 'cascade',
    }),
    token: varchar('token', { length: 255 }).unique().notNull(),
    access: varchar('access', { length: 20 }).notNull().default('view'),
    hasPassword: boolean('has_password').default(false),
    passwordHash: text('password_hash'),
    expiresAt: timestamp('expires_at'),
    maxDownloads: integer('max_downloads'),
    downloadCount: integer('download_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    lastAccessedAt: timestamp('last_accessed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('share_links_token_idx').on(table.token),
    index('share_links_workspace_id_idx').on(table.workspaceId),
    index('share_links_user_id_idx').on(table.userId),
    index('share_links_file_id_idx').on(table.fileId),
    index('share_links_folder_id_idx').on(table.folderId),
  ],
);

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [shareLinks.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [shareLinks.userId],
    references: [users.id],
  }),
  file: one(files, {
    fields: [shareLinks.fileId],
    references: [files.id],
  }),
  folder: one(folders, {
    fields: [shareLinks.folderId],
    references: [folders.id],
  }),
}));
