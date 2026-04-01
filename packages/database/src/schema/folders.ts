import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('folders_workspace_id_idx').on(table.workspaceId),
    index('folders_user_id_idx').on(table.userId),
    index('folders_parent_id_idx').on(table.parentId),
    index('folders_workspace_parent_idx').on(
      table.workspaceId,
      table.parentId,
    ),
  ],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [folders.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: 'parentChild',
  }),
  children: many(folders, {
    relationName: 'parentChild',
  }),
}));
