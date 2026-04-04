import { and, eq } from "drizzle-orm";
import { workspacePlugins, workspacePluginSecrets } from "@locker/database";
import type { Database } from "@locker/database";
import { decryptPluginSecret } from "./secrets";
import type { EndpointConfig } from "./handlers/fts-client";

/**
 * Resolve the endpoint configuration for a search plugin.
 *
 * Checks if the plugin is active for the workspace, loads any
 * custom serviceUrl / apiSecret from the installation record, and
 * falls back to the provided environment-variable defaults.
 *
 * Returns `null` when the plugin is not active or no URL is available
 * from either the config or the environment.
 */
export async function resolvePluginEndpoint(
  db: Database,
  workspaceId: string,
  pluginSlug: string,
  envDefaults: EndpointConfig,
): Promise<EndpointConfig | null> {
  const [plugin] = await db
    .select({
      id: workspacePlugins.id,
      config: workspacePlugins.config,
    })
    .from(workspacePlugins)
    .where(
      and(
        eq(workspacePlugins.workspaceId, workspaceId),
        eq(workspacePlugins.pluginSlug, pluginSlug),
        eq(workspacePlugins.status, "active"),
      ),
    )
    .limit(1);

  if (!plugin) return null;

  const config =
    plugin.config && typeof plugin.config === "object"
      ? (plugin.config as Record<string, string | number | boolean | null>)
      : {};

  const serviceUrl = (config.serviceUrl as string) || envDefaults.serviceUrl;
  if (!serviceUrl) return null;

  // Resolve apiSecret: prefer workspace-level secret, fall back to env var
  let apiSecret = envDefaults.apiSecret;
  const secretRows = await db
    .select({
      encryptedValue: workspacePluginSecrets.encryptedValue,
    })
    .from(workspacePluginSecrets)
    .where(
      and(
        eq(workspacePluginSecrets.workspacePluginId, plugin.id),
        eq(workspacePluginSecrets.key, "apiSecret"),
      ),
    )
    .limit(1);

  if (secretRows[0]) {
    try {
      apiSecret = decryptPluginSecret(secretRows[0].encryptedValue);
    } catch {}
  }

  return { serviceUrl, apiSecret };
}
