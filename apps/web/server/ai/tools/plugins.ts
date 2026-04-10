import { tool } from "ai";
import { z } from "zod/v4";
import { eq, and, desc } from "drizzle-orm";
import {
  workspacePlugins,
  pluginRegistryEntries,
  workspacePluginSecrets,
} from "@locker/database";
import { getBuiltinPluginCatalog } from "../../plugins/catalog";
import type { AssistantToolContext } from "./types";

export function createPluginTools(ctx: AssistantToolContext) {
  return {
    listPlugins: tool({
      description:
        "List available and installed plugins for the workspace. Shows which plugins are active.",
      inputSchema: z.object({}),
      execute: async () => {
        const builtinCatalog = getBuiltinPluginCatalog();

        // Get custom registry entries
        const customEntries = await ctx.db
          .select({
            slug: pluginRegistryEntries.slug,
            manifest: pluginRegistryEntries.manifest,
          })
          .from(pluginRegistryEntries)
          .where(
            and(
              eq(pluginRegistryEntries.workspaceId, ctx.workspaceId),
              eq(pluginRegistryEntries.isActive, true),
            ),
          )
          .orderBy(desc(pluginRegistryEntries.updatedAt));

        // Get installed plugins
        const installed = await ctx.db
          .select({
            id: workspacePlugins.id,
            pluginSlug: workspacePlugins.pluginSlug,
            status: workspacePlugins.status,
            grantedPermissions: workspacePlugins.grantedPermissions,
          })
          .from(workspacePlugins)
          .where(eq(workspacePlugins.workspaceId, ctx.workspaceId));

        const installedMap = new Map(
          installed.map((p) => [p.pluginSlug, p]),
        );

        // Merge catalogs
        const catalog = builtinCatalog.map((entry) => {
          const inst = installedMap.get(entry.slug);
          return {
            slug: entry.slug,
            name: entry.name,
            description: entry.description,
            capabilities: entry.capabilities,
            installed: inst
              ? { id: inst.id, status: inst.status }
              : null,
          };
        });

        // Add custom entries not in built-in catalog
        for (const entry of customEntries) {
          const manifest = entry.manifest as any;
          if (!builtinCatalog.some((b) => b.slug === entry.slug)) {
            const inst = installedMap.get(entry.slug);
            catalog.push({
              slug: entry.slug,
              name: manifest?.name ?? entry.slug,
              description: manifest?.description ?? "",
              capabilities: manifest?.capabilities ?? [],
              installed: inst
                ? { id: inst.id, status: inst.status }
                : null,
            });
          }
        }

        return { plugins: catalog };
      },
    }),
  };
}
