import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';

export const s3MultipartUploads = pgTable(
  's3_multipart_uploads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    uploadId: varchar('upload_id', { length: 128 }).notNull(),
    s3Key: text('s3_key').notNull(),
    storagePath: text('storage_path').notNull(),
    contentType: varchar('content_type', { length: 255 }).notNull(),
    userId: text('user_id').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('in_progress'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('s3_multipart_upload_id_idx').on(table.uploadId),
    index('s3_multipart_workspace_status_idx').on(table.workspaceId, table.status),
  ],
);

export const s3MultipartParts = pgTable(
  's3_multipart_parts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    uploadId: varchar('upload_id', { length: 128 }).notNull(),
    partNumber: integer('part_number').notNull(),
    storagePath: text('storage_path').notNull(),
    size: bigint('size', { mode: 'number' }).notNull().default(0),
    etag: varchar('etag', { length: 128 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('s3_multipart_parts_upload_part_idx').on(table.uploadId, table.partNumber),
    index('s3_multipart_parts_upload_id_idx').on(table.uploadId),
  ],
);

export const s3MultipartUploadsRelations = relations(s3MultipartUploads, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [s3MultipartUploads.workspaceId],
    references: [workspaces.id],
  }),
}));
