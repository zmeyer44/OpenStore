import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { PluginManifest, PluginPermission } from '@locker/common';
import { workspaces } from './workspaces';
import { users } from './users';

type PluginConfigValue = string | number | boolean | null;

export const pluginRegistryEntries = pgTable(
  'plugin_registry_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    createdById: text('created_by_id')
      .references(() => users.id, { onDelete: 'set null' }),
    slug: varchar('slug', { length: 80 }).notNull(),
    manifest: jsonb('manifest').$type<PluginManifest>().notNull(),
    source: varchar('source', { length: 20 }).notNull().default('inhouse'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('plugin_registry_entries_workspace_slug_idx').on(
      table.workspaceId,
      table.slug,
    ),
    index('plugin_registry_entries_workspace_idx').on(table.workspaceId),
  ],
);

export const workspacePlugins = pgTable(
  'workspace_plugins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    installedById: text('installed_by_id')
      .references(() => users.id, { onDelete: 'set null' }),
    pluginSlug: varchar('plugin_slug', { length: 80 }).notNull(),
    source: varchar('source', { length: 20 }).notNull(),
    manifest: jsonb('manifest').$type<PluginManifest>().notNull(),
    grantedPermissions: jsonb('granted_permissions')
      .$type<PluginPermission[]>()
      .notNull(),
    config: jsonb('config')
      .$type<Record<string, PluginConfigValue>>()
      .notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('workspace_plugins_workspace_slug_idx').on(
      table.workspaceId,
      table.pluginSlug,
    ),
    index('workspace_plugins_workspace_idx').on(table.workspaceId),
    index('workspace_plugins_status_idx').on(table.status),
  ],
);

export const workspacePluginSecrets = pgTable(
  'workspace_plugin_secrets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspacePluginId: uuid('workspace_plugin_id')
      .notNull()
      .references(() => workspacePlugins.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 80 }).notNull(),
    encryptedValue: text('encrypted_value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('workspace_plugin_secrets_plugin_key_idx').on(
      table.workspacePluginId,
      table.key,
    ),
    index('workspace_plugin_secrets_plugin_idx').on(table.workspacePluginId),
  ],
);

export const pluginInvocationLogs = pgTable(
  'plugin_invocation_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspacePluginId: uuid('workspace_plugin_id')
      .notNull()
      .references(() => workspacePlugins.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    actionId: varchar('action_id', { length: 120 }).notNull(),
    targetType: varchar('target_type', { length: 20 }),
    targetId: uuid('target_id'),
    status: varchar('status', { length: 20 }).notNull(),
    details: jsonb('details').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('plugin_invocation_logs_plugin_idx').on(table.workspacePluginId),
    index('plugin_invocation_logs_actor_idx').on(table.actorUserId),
    index('plugin_invocation_logs_created_idx').on(table.createdAt),
  ],
);

export const pluginRegistryEntriesRelations = relations(
  pluginRegistryEntries,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [pluginRegistryEntries.workspaceId],
      references: [workspaces.id],
    }),
    createdBy: one(users, {
      fields: [pluginRegistryEntries.createdById],
      references: [users.id],
    }),
  }),
);

export const workspacePluginsRelations = relations(
  workspacePlugins,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workspacePlugins.workspaceId],
      references: [workspaces.id],
    }),
    installedBy: one(users, {
      fields: [workspacePlugins.installedById],
      references: [users.id],
    }),
    secrets: many(workspacePluginSecrets),
    invocations: many(pluginInvocationLogs),
  }),
);

export const workspacePluginSecretsRelations = relations(
  workspacePluginSecrets,
  ({ one }) => ({
    workspacePlugin: one(workspacePlugins, {
      fields: [workspacePluginSecrets.workspacePluginId],
      references: [workspacePlugins.id],
    }),
  }),
);

export const pluginInvocationLogsRelations = relations(
  pluginInvocationLogs,
  ({ one }) => ({
    workspacePlugin: one(workspacePlugins, {
      fields: [pluginInvocationLogs.workspacePluginId],
      references: [workspacePlugins.id],
    }),
    actor: one(users, {
      fields: [pluginInvocationLogs.actorUserId],
      references: [users.id],
    }),
  }),
);
