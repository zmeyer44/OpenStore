"use client";

import { useMemo, useState } from "react";
import {
  Puzzle,
  Search,
  Settings2,
  Power,
  PowerOff,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ExternalLink,
} from "lucide-react";
import {
  PLUGIN_PERMISSION_LABELS,
  pluginManifestSchema,
  type PluginConfigField,
  type PluginManifest,
} from "@locker/common";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ConfigDraft = Record<string, string>;

function getFieldInitialValue(
  field: PluginConfigField,
  config: Record<string, string | number | boolean | null>,
): string {
  const value = config[field.key];
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function normalizeConfigForSubmit(
  manifest: PluginManifest,
  draft: ConfigDraft,
): {
  config: Record<string, string | number | boolean | null>;
  secrets: Record<string, string>;
} {
  const config: Record<string, string | number | boolean | null> = {};
  const secrets: Record<string, string> = {};

  for (const field of manifest.configFields) {
    const rawValue = draft[field.key]?.trim() ?? "";

    if (field.type === "secret") {
      if (rawValue.length > 0) secrets[field.key] = rawValue;
      continue;
    }

    if (rawValue.length === 0) continue;

    if (field.type === "number") {
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) continue;
      config[field.key] = parsed;
      continue;
    }

    if (field.type === "boolean") {
      config[field.key] = rawValue === "true";
      continue;
    }

    config[field.key] = rawValue;
  }

  return { config, secrets };
}

export default function PluginsPage() {
  const workspace = useWorkspace();
  const isAdmin = workspace.role === "owner" || workspace.role === "admin";
  const utils = trpc.useUtils();

  const { data: catalog, isLoading: catalogLoading } =
    trpc.plugins.catalog.useQuery();
  const { data: installed, isLoading: installedLoading } =
    trpc.plugins.installed.useQuery();

  const [search, setSearch] = useState("");
  const [activeManifestSlug, setActiveManifestSlug] = useState<string | null>(
    null,
  );
  const [activeInstallId, setActiveInstallId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<ConfigDraft>({});
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [manifestText, setManifestText] = useState(
    JSON.stringify(
      {
        slug: "my-plugin",
        name: "My Plugin",
        description: "Describe what your plugin does.",
        version: "0.1.0",
        developer: "Your Team",
        source: "inhouse",
        permissions: ["files.read"],
        capabilities: ["file_actions"],
        actions: [
          {
            id: "my-plugin.action",
            label: "Run Action",
            target: "file",
            requiresPermissions: ["files.read"],
          },
        ],
        configFields: [],
      },
      null,
      2,
    ),
  );

  const selectedManifest = useMemo(
    () => catalog?.find((entry) => entry.slug === activeManifestSlug) ?? null,
    [catalog, activeManifestSlug],
  );
  const selectedInstalled = useMemo(
    () => installed?.find((entry) => entry.id === activeInstallId) ?? null,
    [installed, activeInstallId],
  );

  const installMutation = trpc.plugins.install.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.plugins.catalog.invalidate(),
        utils.plugins.installed.invalidate(),
      ]);
      setActiveManifestSlug(null);
      setConfigDraft({});
      toast.success("Plugin installed");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateConfigMutation = trpc.plugins.updateConfig.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.plugins.catalog.invalidate(),
        utils.plugins.installed.invalidate(),
      ]);
      setActiveInstallId(null);
      setConfigDraft({});
      toast.success("Plugin configuration updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const setStatusMutation = trpc.plugins.setStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.plugins.catalog.invalidate(),
        utils.plugins.installed.invalidate(),
      ]);
      toast.success("Plugin status updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const uninstallMutation = trpc.plugins.uninstall.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.plugins.catalog.invalidate(),
        utils.plugins.installed.invalidate(),
      ]);
      toast.success("Plugin uninstalled");
    },
    onError: (error) => toast.error(error.message),
  });

  const registerCustomMutation = trpc.plugins.registerCustom.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.plugins.catalog.invalidate(),
        utils.plugins.installed.invalidate(),
      ]);
      setRegisterDialogOpen(false);
      toast.success("Plugin registered to this workspace");
    },
    onError: (error) => toast.error(error.message),
  });

  const installedBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof installed>[number]>();
    for (const plugin of installed ?? []) {
      map.set(plugin.pluginSlug, plugin);
    }
    return map;
  }, [installed]);

  const availableCatalog = useMemo(
    () => (catalog ?? []).filter((entry) => !installedBySlug.has(entry.slug)),
    [catalog, installedBySlug],
  );

  // Filter installed + catalog by search
  const lowerSearch = search.toLowerCase();
  const filteredInstalled = useMemo(
    () =>
      (installed ?? []).filter(
        (p) =>
          !search ||
          p.manifest.name.toLowerCase().includes(lowerSearch) ||
          p.manifest.description.toLowerCase().includes(lowerSearch) ||
          p.pluginSlug.includes(lowerSearch),
      ),
    [installed, search, lowerSearch],
  );
  const filteredCatalog = useMemo(
    () =>
      availableCatalog.filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(lowerSearch) ||
          p.description.toLowerCase().includes(lowerSearch) ||
          p.slug.includes(lowerSearch),
      ),
    [availableCatalog, search, lowerSearch],
  );

  const openInstallDialog = (manifest: PluginManifest) => {
    if (!isAdmin) return;
    const nextDraft: ConfigDraft = {};
    for (const field of manifest.configFields) nextDraft[field.key] = "";
    setConfigDraft(nextDraft);
    setActiveManifestSlug(manifest.slug);
  };

  const openConfigureDialog = (pluginId: string) => {
    if (!isAdmin) return;
    const plugin = installed?.find((entry) => entry.id === pluginId);
    if (!plugin) return;
    const nextDraft: ConfigDraft = {};
    for (const field of plugin.manifest.configFields) {
      nextDraft[field.key] = getFieldInitialValue(field, plugin.config);
    }
    setConfigDraft(nextDraft);
    setActiveInstallId(pluginId);
  };

  const handleInstall = async () => {
    if (!selectedManifest) return;
    const { config, secrets } = normalizeConfigForSubmit(
      selectedManifest,
      configDraft,
    );
    await installMutation.mutateAsync({
      slug: selectedManifest.slug,
      grantedPermissions: selectedManifest.permissions,
      config,
      secrets,
    });
  };

  const handleConfigure = async () => {
    if (!selectedInstalled) return;
    const { config, secrets } = normalizeConfigForSubmit(
      selectedInstalled.manifest,
      configDraft,
    );
    await updateConfigMutation.mutateAsync({
      id: selectedInstalled.id,
      config,
      secrets,
    });
  };

  const renderConfigField = (field: PluginConfigField) => {
    const value = configDraft[field.key] ?? "";
    const setValue = (nextValue: string) =>
      setConfigDraft((current) => ({ ...current, [field.key]: nextValue }));
    const requiredLabel = field.required ? " *" : "";
    const inputType =
      field.type === "secret"
        ? "password"
        : field.type === "url"
          ? "url"
          : field.type === "number"
            ? "number"
            : "text";

    return (
      <div key={field.key} className="space-y-1.5">
        <label className="text-sm font-medium">
          {field.label}
          {requiredLabel}
        </label>
        {field.type === "boolean" ? (
          <select
            value={value || "false"}
            onChange={(event) => setValue(event.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        ) : (
          <Input
            type={inputType}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={field.placeholder}
          />
        )}
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  };

  const isLoading = catalogLoading || installedLoading;

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center gap-2 px-4">
          <Puzzle className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Plugins</span>
        </div>
        {isAdmin && (
          <div className="px-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRegisterDialogOpen(true)}
            >
              <Plus />
              Register In-House Plugin
            </Button>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Admin warning */}
        {!isAdmin && (
          <div className="rounded-lg border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              You can use installed plugins, but only workspace admins can
              install or configure them.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plugins..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Installed Plugins */}
            {filteredInstalled.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Installed
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {filteredInstalled.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredInstalled.map((plugin) => (
                    <InstalledPluginCard
                      key={plugin.id}
                      plugin={plugin}
                      isAdmin={isAdmin}
                      onConfigure={() => openConfigureDialog(plugin.id)}
                      onToggleStatus={() =>
                        setStatusMutation.mutate({
                          id: plugin.id,
                          status:
                            plugin.status === "active" ? "disabled" : "active",
                        })
                      }
                      onUninstall={() => {
                        if (
                          confirm(`Uninstall ${plugin.manifest.name}?`)
                        ) {
                          uninstallMutation.mutate({ id: plugin.id });
                        }
                      }}
                      isPending={
                        setStatusMutation.isPending ||
                        uninstallMutation.isPending
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Catalog */}
            {filteredCatalog.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Available
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {filteredCatalog.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredCatalog.map((plugin) => (
                    <CatalogPluginCard
                      key={plugin.slug}
                      manifest={plugin}
                      isAdmin={isAdmin}
                      onInstall={() => openInstallDialog(plugin)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty search results */}
            {filteredInstalled.length === 0 &&
              filteredCatalog.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  {search
                    ? `No plugins matching "${search}"`
                    : "No plugins available."}
                </div>
              )}
          </>
        )}
      </div>

      {/* Install Dialog */}
      <Dialog
        open={!!selectedManifest}
        onOpenChange={(open) => {
          if (!open) {
            setActiveManifestSlug(null);
            setConfigDraft({});
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Install {selectedManifest?.name}</DialogTitle>
            <DialogDescription>
              Review permissions and provide any required configuration.
            </DialogDescription>
          </DialogHeader>

          {selectedManifest && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-medium">Permissions</p>
                <div className="space-y-1">
                  {selectedManifest.permissions.map((permission) => (
                    <div key={permission}>
                      <p className="text-xs font-medium">
                        {PLUGIN_PERMISSION_LABELS[permission].label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PLUGIN_PERMISSION_LABELS[permission].description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedManifest.configFields.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Configuration</p>
                  {selectedManifest.configFields.map(renderConfigField)}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActiveManifestSlug(null);
                setConfigDraft({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={installMutation.isPending}>
              {installMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Dialog */}
      <Dialog
        open={!!selectedInstalled}
        onOpenChange={(open) => {
          if (!open) {
            setActiveInstallId(null);
            setConfigDraft({});
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedInstalled?.manifest.name}
            </DialogTitle>
            <DialogDescription>
              Update runtime configuration and secret values.
            </DialogDescription>
          </DialogHeader>

          {selectedInstalled && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedInstalled.manifest.configFields.length === 0 ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  This plugin does not require any configuration.
                </div>
              ) : (
                selectedInstalled.manifest.configFields.map(renderConfigField)
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActiveInstallId(null);
                setConfigDraft({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfigure}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register In-House Plugin</DialogTitle>
            <DialogDescription>
              Paste a plugin manifest JSON document. It will become available in
              this workspace catalog.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={manifestText}
            onChange={(event) => setManifestText(event.target.value)}
            className="w-full h-72 rounded-md border bg-background p-3 font-mono text-xs"
            spellCheck={false}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  const parsed = JSON.parse(manifestText) as unknown;
                  const manifest = pluginManifestSchema.parse(parsed);
                  registerCustomMutation.mutate({ manifest });
                } catch {
                  toast.error("Invalid JSON manifest");
                }
              }}
              disabled={registerCustomMutation.isPending}
            >
              {registerCustomMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Register Plugin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Plugin Cards ────────────────────────────────────────────────────────

function InstalledPluginCard({
  plugin,
  isAdmin,
  onConfigure,
  onToggleStatus,
  onUninstall,
  isPending,
}: {
  plugin: {
    id: string;
    pluginSlug: string;
    source: string;
    status: string;
    manifest: PluginManifest;
    grantedPermissions: string[];
    config: Record<string, string | number | boolean | null>;
    configuredSecretKeys: string[];
    missingConfigFields: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  isAdmin: boolean;
  onConfigure: () => void;
  onToggleStatus: () => void;
  onUninstall: () => void;
  isPending: boolean;
}) {
  const isActive = plugin.status === "active";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 transition-colors",
        isActive
          ? "border-border"
          : "border-border/50 opacity-70",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Puzzle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {plugin.manifest.name}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isActive ? "bg-emerald-500" : "bg-muted-foreground/50",
                )}
              />
              {isActive ? "Active" : "Disabled"}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {plugin.manifest.description}
          </p>
        </div>
      </div>

      {/* Permissions summary */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="size-3 shrink-0" />
        <span>
          {plugin.grantedPermissions.length} permission
          {plugin.grantedPermissions.length !== 1 ? "s" : ""}
        </span>
        <span className="text-border">|</span>
        <span className="text-[10px] uppercase tracking-wider">
          {plugin.manifest.source}
        </span>
        <span className="text-border">|</span>
        <span>v{plugin.manifest.version}</span>
      </div>

      {/* Missing config warning */}
      {plugin.missingConfigFields.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
          <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            Missing: {plugin.missingConfigFields.join(", ")}
          </p>
        </div>
      )}

      {/* Actions */}
      {isAdmin && (
        <div className="flex items-center gap-1.5 pt-1">
          <Button size="xs" variant="outline" onClick={onConfigure}>
            <Settings2 className="size-3" />
            Configure
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={onToggleStatus}
            disabled={isPending}
          >
            {isActive ? (
              <>
                <PowerOff className="size-3" />
                Disable
              </>
            ) : (
              <>
                <Power className="size-3" />
                Enable
              </>
            )}
          </Button>
          <Button
            size="xs"
            variant="destructive"
            onClick={onUninstall}
            disabled={isPending}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function CatalogPluginCard({
  manifest,
  isAdmin,
  onInstall,
}: {
  manifest: PluginManifest;
  isAdmin: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/50 p-4 space-y-3 transition-colors hover:border-border hover:bg-card">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Puzzle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{manifest.name}</p>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {manifest.source}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {manifest.description}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5">
        {manifest.permissions.map((perm) => (
          <span
            key={perm}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            title={PLUGIN_PERMISSION_LABELS[perm].description}
          >
            {PLUGIN_PERMISSION_LABELS[perm].label}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>v{manifest.version}</span>
          {manifest.homepageUrl && (
            <a
              href={manifest.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Docs
            </a>
          )}
        </div>
        {isAdmin && (
          <Button size="xs" onClick={onInstall}>
            Install
          </Button>
        )}
      </div>
    </div>
  );
}
