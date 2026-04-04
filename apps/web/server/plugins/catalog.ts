import { pluginManifestSchema, type PluginManifest } from "@locker/common";

const builtinPluginManifestsRaw: PluginManifest[] = [
  {
    slug: "qmd-search",
    name: "QMD Search",
    description:
      "Full-text and semantic document search powered by QMD. Automatically indexes uploaded documents for intelligent discovery.",
    version: "0.2.0",
    developer: "Locker",
    homepageUrl: "https://github.com/tobi/qmd",
    source: "official",
    permissions: ["files.read", "search.read", "search.enhance"],
    capabilities: ["workspace_search", "file_actions"],
    actions: [
      {
        id: "qmd.reindex-file",
        label: "Refresh Discovery Index",
        description:
          "Re-index this file so future searches surface the newest content faster.",
        target: "file",
        requiresPermissions: ["files.read", "search.enhance"],
      },
    ],
    configFields: [
      {
        key: "serviceUrl",
        label: "Service URL",
        description:
          "Custom endpoint URL for the QMD service. Falls back to the QMD_SERVICE_URL environment variable when empty.",
        type: "url",
        required: false,
      },
      {
        key: "apiSecret",
        label: "API Secret",
        description:
          "Authentication secret for the QMD service. Falls back to the QMD_API_SECRET environment variable when empty.",
        type: "secret",
        required: false,
      },
    ],
  },
  {
    slug: "fts-search",
    name: "Full-Text Search",
    description:
      "Lightweight full-text file content search using SQLite FTS5. Runs entirely in-process with minimal memory — no external service or ML model required.",
    version: "0.1.0",
    developer: "Locker",
    source: "official",
    permissions: ["files.read", "search.read", "search.enhance"],
    capabilities: ["workspace_search", "file_actions"],
    actions: [
      {
        id: "fts.reindex-file",
        label: "Refresh Search Index",
        description:
          "Re-index this file for full-text search so queries match the latest content.",
        target: "file",
        requiresPermissions: ["files.read", "search.enhance"],
      },
    ],
    configFields: [
      {
        key: "serviceUrl",
        label: "Service URL",
        description:
          "Custom endpoint URL for the FTS service. Falls back to the FTS_SERVICE_URL environment variable when empty.",
        type: "url",
        required: false,
      },
      {
        key: "apiSecret",
        label: "API Secret",
        description:
          "Authentication secret for the FTS service. Falls back to the FTS_API_SECRET environment variable when empty.",
        type: "secret",
        required: false,
      },
    ],
  },
  {
    slug: "google-drive-sync",
    name: "Google Drive Sync",
    description:
      "Transfer files between Locker and Google Drive directly from file and folder workflows.",
    version: "0.1.0",
    developer: "Locker",
    homepageUrl: "https://developers.google.com/drive",
    source: "official",
    permissions: [
      "files.read",
      "files.write",
      "folders.read",
      "folders.write",
      "external.network",
      "external.storage-service",
    ],
    capabilities: ["file_actions", "folder_actions", "import_export"],
    actions: [
      {
        id: "google-drive.export-file",
        label: "Export To Drive",
        description:
          "Send this file to your connected Google Drive destination.",
        target: "file",
        requiresPermissions: ["files.read", "external.storage-service"],
      },
      {
        id: "google-drive.import-into-folder",
        label: "Import From Drive",
        description:
          "Import files from Google Drive directly into this folder.",
        target: "folder",
        requiresPermissions: ["files.write", "external.storage-service"],
      },
    ],
    configFields: [
      {
        key: "clientId",
        label: "Google OAuth Client ID",
        type: "text",
        required: true,
      },
      {
        key: "clientSecret",
        label: "Google OAuth Client Secret",
        type: "secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Google Refresh Token",
        type: "secret",
        required: true,
      },
      {
        key: "defaultDestinationFolderId",
        label: "Default Drive Folder ID",
        description:
          "Optional. Destination folder used when exporting without a specific Drive target.",
        type: "text",
        required: false,
      },
    ],
  },
];

const builtinPluginManifests = builtinPluginManifestsRaw.map((manifest) =>
  pluginManifestSchema.parse(manifest),
);

export function getBuiltinPluginCatalog(): PluginManifest[] {
  return builtinPluginManifests.map((manifest) => ({ ...manifest }));
}

export function getBuiltinPluginBySlug(slug: string): PluginManifest | null {
  const found = builtinPluginManifests.find(
    (manifest) => manifest.slug === slug,
  );
  return found ? { ...found } : null;
}
