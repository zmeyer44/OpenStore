import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { users } from './users';

export const s3ApiKeys = pgTable(
  's3_api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessKeyId: varchar('access_key_id', { length: 64 }).notNull(),
    encryptedSecret: text('encrypted_secret').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    permissions: varchar('permissions', { length: 20 }).notNull().default('readwrite'),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('s3_api_keys_access_key_id_idx').on(table.accessKeyId),
    index('s3_api_keys_workspace_id_idx').on(table.workspaceId),
  ],
);

export const s3ApiKeysRelations = relations(s3ApiKeys, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [s3ApiKeys.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [s3ApiKeys.userId],
    references: [users.id],
  }),
}));
