"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Provider = "s3" | "r2" | "vercel_blob" | "local";
type WriteMode = "write" | "read_only";
type IngestMode = "none" | "scan";

type StoreForm = {
  name: string;
  provider: Provider;
  writeMode: WriteMode;
  ingestMode: IngestMode;
  readPriority: number;
  bucket: string;
  region: string;
  endpoint: string;
  accountId: string;
  publicUrl: string;
  baseDir: string;
  rootPrefix: string;
  accessKeyId: string;
  secretAccessKey: string;
  readWriteToken: string;
};

const PROVIDER_LABELS: Record<Provider, string> = {
  s3: "Amazon S3",
  r2: "Cloudflare R2",
  vercel_blob: "Vercel Blob",
  local: "Local Disk",
};

function emptyForm(provider: Provider = "s3"): StoreForm {
  return {
    name: "",
    provider,
    writeMode: "write",
    ingestMode: "none",
    readPriority: 100,
    bucket: "",
    region: "",
    endpoint: "",
    accountId: "",
    publicUrl: "",
    baseDir: "",
    rootPrefix: "",
    accessKeyId: "",
    secretAccessKey: "",
    readWriteToken: "",
  };
}

function coerceString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formFromStore(store: any): StoreForm {
  const config = (store?.config ?? {}) as Record<string, unknown>;
  return {
    name: store.name ?? "",
    provider: store.provider,
    writeMode: store.writeMode,
    ingestMode: store.ingestMode,
    readPriority: store.readPriority ?? 100,
    bucket: coerceString(config.bucket),
    region: coerceString(config.region),
    endpoint: coerceString(config.endpoint),
    accountId: coerceString(config.accountId),
    publicUrl: coerceString(config.publicUrl),
    baseDir: coerceString(config.baseDir),
    rootPrefix: coerceString(config.rootPrefix),
    accessKeyId: "",
    secretAccessKey: "",
    readWriteToken: "",
  };
}

function buildPayload(form: StoreForm) {
  return {
    name: form.name,
    provider: form.provider,
    writeMode: form.writeMode,
    ingestMode: form.ingestMode,
    readPriority: Number(form.readPriority) || 100,
    bucket: form.bucket || undefined,
    region: form.region || undefined,
    endpoint: form.endpoint || undefined,
    accountId: form.accountId || undefined,
    publicUrl: form.publicUrl || undefined,
    baseDir: form.baseDir || undefined,
    rootPrefix: form.rootPrefix || undefined,
    credentials:
      form.provider === "s3"
        ? {
            accessKeyId: form.accessKeyId,
            secretAccessKey: form.secretAccessKey,
          }
        : form.provider === "r2"
          ? {
              accountId: form.accountId,
              accessKeyId: form.accessKeyId,
              secretAccessKey: form.secretAccessKey,
            }
          : form.provider === "vercel_blob"
            ? { readWriteToken: form.readWriteToken }
            : undefined,
  };
}

export default function StoresSettingsPage() {
  const workspace = useWorkspace();
  const utils = trpc.useUtils();
  const { data: stores = [], isLoading } = trpc.stores.list.useQuery();
  const { data: syncRuns = [] } = trpc.stores.syncStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string | "new">("new");
  const [form, setForm] = useState<StoreForm>(emptyForm());

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  );

  useEffect(() => {
    if (selectedStoreId === "new") {
      setForm(emptyForm(form.provider));
      return;
    }
    if (selectedStore) {
      setForm(formFromStore(selectedStore));
    }
  }, [selectedStoreId, selectedStore]);

  const invalidate = () => {
    utils.stores.list.invalidate();
    utils.stores.syncStatus.invalidate();
  };

  const createStore = trpc.stores.create.useMutation({
    onSuccess: () => {
      toast.success("Store created");
      invalidate();
      setSelectedStoreId("new");
      setForm(emptyForm());
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStore = trpc.stores.update.useMutation({
    onSuccess: () => {
      toast.success("Store updated");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const testStore = trpc.stores.test.useMutation({
    onSuccess: () => toast.success("Connection successful"),
    onError: (error) => toast.error(error.message),
  });

  const removeStore = trpc.stores.remove.useMutation({
    onSuccess: () => {
      toast.success("Store archived");
      invalidate();
      setSelectedStoreId("new");
      setForm(emptyForm());
    },
    onError: (error) => toast.error(error.message),
  });

  const setPrimary = trpc.stores.setPrimary.useMutation({
    onSuccess: () => {
      toast.success("Primary store updated");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const syncStores = trpc.stores.sync.useMutation({
    onSuccess: () => {
      toast.success("Sync started");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const ingestStore = trpc.stores.ingest.useMutation({
    onSuccess: (result) => {
      toast.success(`Ingested ${result.ingested} file(s)`);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const isSaving = createStore.isPending || updateStore.isPending;
  const latestRun = syncRuns[0];

  const canSave =
    form.name.trim().length > 0 &&
    (form.provider === "local" ||
      form.provider === "vercel_blob" ||
      form.bucket.trim().length > 0);

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Stores</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/w/${workspace.slug}/settings`}>
              <ArrowLeft className="mr-1 size-4" />
              Back to settings
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Workspace Stores
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Attach multiple storage backends, choose a primary write
                  destination, and fan out copies for redundancy.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncStores.mutate({})}
                  disabled={syncStores.isPending}
                >
                  {syncStores.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Sync all
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedStoreId("new");
                    setForm(emptyForm());
                  }}
                >
                  <HardDrive className="mr-2 size-4" />
                  Add store
                </Button>
              </div>
            </div>
            {latestRun && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span>Latest sync:</span>
                <Badge variant="secondary">{latestRun.status}</Badge>
                <span>
                  {latestRun.processedItems}/{latestRun.totalItems} processed
                </span>
                {latestRun.failedItems > 0 && (
                  <span>{latestRun.failedItems} failed</span>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
                Loading stores…
              </div>
            ) : (
              stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => setSelectedStoreId(store.id)}
                  className={cn(
                    "rounded-2xl border bg-card p-5 text-left transition-colors hover:border-foreground/20",
                    selectedStoreId === store.id && "border-foreground/30",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold">{store.name}</h2>
                        {store.isPrimary && <Badge>Primary</Badge>}
                        {store.writeMode === "read_only" && (
                          <Badge variant="secondary">Read-only</Badge>
                        )}
                        {store.credentialSource === "platform" && (
                          <Badge variant="outline">Platform</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {PROVIDER_LABELS[store.provider]} • priority{" "}
                        {store.readPriority}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!store.isPrimary && store.writeMode === "write" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPrimary.mutate({ id: store.id });
                          }}
                        >
                          <ShieldCheck className="mr-2 size-4" />
                          Make primary
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          syncStores.mutate({ storeId: store.id });
                        }}
                      >
                        <RefreshCw className="mr-2 size-4" />
                        Sync
                      </Button>
                      {store.writeMode === "read_only" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            ingestStore.mutate({ storeId: store.id });
                          }}
                        >
                          <Upload className="mr-2 size-4" />
                          Ingest
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <div>
                      <span className="font-medium text-foreground">Last sync:</span>{" "}
                      {store.lastSyncedAt
                        ? new Date(store.lastSyncedAt).toLocaleString()
                        : "Never"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Last test:</span>{" "}
                      {store.lastTestedAt
                        ? new Date(store.lastTestedAt).toLocaleString()
                        : "Never"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Secret:</span>{" "}
                      {store.hasStoredSecret ? "Stored" : "None"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {selectedStore ? `Edit ${selectedStore.name}` : "Add a Store"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure where workspace files should live and how replicas should
              behave.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="My NAS"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <Select
                  value={form.provider}
                  disabled={!!selectedStore}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...emptyForm(value as Provider),
                      name: current.name,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="r2">Cloudflare R2</SelectItem>
                    <SelectItem value="vercel_blob">Vercel Blob</SelectItem>
                    <SelectItem value="local">Local Disk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Write Mode</label>
                <Select
                  value={form.writeMode}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      writeMode: value as WriteMode,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="write">Writable replica</SelectItem>
                    <SelectItem value="read_only">Read-only ingest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingest Mode</label>
                <Select
                  value={form.ingestMode}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      ingestMode: value as IngestMode,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No ingest scanning</SelectItem>
                    <SelectItem value="scan">Scan for new files</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Read Priority</label>
                <Input
                  type="number"
                  value={form.readPriority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      readPriority: Number(event.target.value) || 100,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Root Prefix</label>
              <Input
                value={form.rootPrefix}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rootPrefix: event.target.value,
                  }))
                }
                placeholder="locker-data"
              />
            </div>

            {(form.provider === "s3" || form.provider === "r2") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Bucket</label>
                <Input
                  value={form.bucket}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bucket: event.target.value,
                    }))
                  }
                  placeholder="workspace-storage"
                />
              </div>
            )}

            {form.provider === "s3" && (
              <>
                <InputBlock
                  label="Region"
                  value={form.region}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, region: value }))
                  }
                  placeholder="us-east-1"
                />
                <InputBlock
                  label="Endpoint"
                  value={form.endpoint}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, endpoint: value }))
                  }
                  placeholder="https://s3.amazonaws.com"
                />
                <InputBlock
                  label="Access Key ID"
                  value={form.accessKeyId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, accessKeyId: value }))
                  }
                  placeholder="AKIA..."
                />
                <InputBlock
                  label="Secret Access Key"
                  value={form.secretAccessKey}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      secretAccessKey: value,
                    }))
                  }
                  placeholder="Enter secret"
                />
              </>
            )}

            {form.provider === "r2" && (
              <>
                <InputBlock
                  label="Account ID"
                  value={form.accountId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, accountId: value }))
                  }
                  placeholder="Cloudflare account ID"
                />
                <InputBlock
                  label="Public URL"
                  value={form.publicUrl}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, publicUrl: value }))
                  }
                  placeholder="https://files.example.com"
                />
                <InputBlock
                  label="Access Key ID"
                  value={form.accessKeyId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, accessKeyId: value }))
                  }
                  placeholder="R2 access key"
                />
                <InputBlock
                  label="Secret Access Key"
                  value={form.secretAccessKey}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      secretAccessKey: value,
                    }))
                  }
                  placeholder="Enter secret"
                />
              </>
            )}

            {form.provider === "vercel_blob" && (
              <InputBlock
                label="Read/Write Token"
                value={form.readWriteToken}
                onChange={(value) =>
                  setForm((current) => ({ ...current, readWriteToken: value }))
                }
                placeholder="vercel_blob_rw_..."
              />
            )}

            {form.provider === "local" && (
              <InputBlock
                label="Base Directory"
                value={form.baseDir}
                onChange={(value) =>
                  setForm((current) => ({ ...current, baseDir: value }))
                }
                placeholder="/var/lib/locker"
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => testStore.mutate(buildPayload(form))}
              variant="outline"
              disabled={testStore.isPending}
            >
              {testStore.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}
              Test connection
            </Button>
            <Button
              onClick={() =>
                selectedStore
                  ? updateStore.mutate({ id: selectedStore.id, store: buildPayload(form) })
                  : createStore.mutate(buildPayload(form))
              }
              disabled={!canSave || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <HardDrive className="mr-2 size-4" />
              )}
              {selectedStore ? "Save changes" : "Create store"}
            </Button>
            {selectedStore && !selectedStore.isPrimary && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Archive this store? Existing synced copies will remain.")) {
                    removeStore.mutate({ id: selectedStore.id });
                  }
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Archive store
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InputBlock(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{props.label}</label>
      <Input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
