"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { File as FileLucide, CalendarDays, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { UploadDialog } from "@/components/upload-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { RenameDialog } from "@/components/rename-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { CreateTrackedLinkDialog } from "@/components/create-tracked-link-dialog";
import { TranscriptionViewer } from "@/components/transcription-viewer";
import { FileTagsDialog } from "@/components/file-tags-dialog";
import { ManageTagsDialog } from "@/components/manage-tags-dialog";
import { DesktopDropOverlay } from "@/components/desktop-drop-overlay";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useFileDownload } from "@/hooks/use-file-download";
import { useWorkspace } from "@/lib/workspace-context";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";

import { ExplorerHeader } from "./components/explorer-header";
import { ExplorerSkeleton } from "./components/explorer-skeleton";
import { EmptyState } from "./components/empty-state";
import { FolderRowContent } from "./components/folder-row-content";
import { FileRowContent } from "./components/file-row-content";
import { DataFilter, type FilterColumnDef } from "./components/data-filter";
import { FileViewToggle } from "./components/file-view-toggle";
import { FileGridCard } from "./components/file-grid-card";
import { FolderGridCard } from "./components/folder-grid-card";

const STORAGE_KEY = "locker:file-view-preference";

export function FileExplorer({ folderId }: { folderId: string | null }) {
  const router = useRouter();
  const workspace = useWorkspace();
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showManageTags, setShowManageTags] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[] | undefined>(
    undefined,
  );
  const [fileView, setFileView] = useState<"row" | "grid">(() => {
    if (typeof window === "undefined") return "row";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "grid" ? "grid" : "row";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fileView);
  }, [fileView]);

  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [trackTarget, setTrackTarget] = useState<{
    id: string;
    name: string;
    type: "file" | "folder";
  } | null>(null);
  const [transcriptionTarget, setTranscriptionTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [tagTarget, setTagTarget] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useQueryState(
    "tags",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedFileTypes, setSelectedFileTypes] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [selectedDates, setSelectedDates] = useQueryState(
    "date",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const utils = trpc.useUtils();
  const { handleDrop } = useFileDrop();

  const { data: breadcrumbs } = trpc.folders.getBreadcrumbs.useQuery({
    folderId,
  });

  const { data: folderList, isLoading: foldersLoading } =
    trpc.folders.list.useQuery({
      parentId: folderId,
    });

  const { data: allTags = [] } = trpc.tags.list.useQuery();

  const { data: fileList, isLoading: filesLoading } = trpc.files.list.useQuery({
    folderId,
    page: 1,
    pageSize: 100,
    field: "name",
    direction: "asc",
    tagSlugs: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    fileTypes:
      selectedFileTypes.length > 0
        ? (selectedFileTypes as (
            | "image"
            | "document"
            | "video"
            | "audio"
            | "archive"
            | "other"
          )[])
        : undefined,
    createdAfter: selectedDates.length > 0 ? selectedDates[0] : undefined,
    createdBefore:
      selectedDates.length > 1
        ? selectedDates[1]
        : selectedDates.length > 0
          ? selectedDates[0]
          : undefined,
  });

  const isLoading = foldersLoading || filesLoading;

  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      utils.storage.usage.invalidate();
      toast.success("File deleted");
    },
  });

  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      toast.success("Folder deleted");
    },
  });

  const { download: downloadFile } = useFileDownload();
  const runPluginAction = trpc.plugins.runAction.useMutation();

  const { data: filePluginActions = [] } = trpc.plugins.fileActions.useQuery({
    target: "file",
  });
  const { data: folderPluginActions = [] } = trpc.plugins.fileActions.useQuery({
    target: "folder",
  });

  const fileIds = useMemo(
    () => (fileList?.items ?? []).map((f) => f.id),
    [fileList],
  );
  const { data: transcriptionStatuses = {} } =
    trpc.transcriptions.statusByFileIds.useQuery(
      { fileIds },
      { enabled: fileIds.length > 0, retry: false },
    );
  const { data: fileTagsMap = {} } = trpc.tags.getFileTagsBatch.useQuery(
    { fileIds },
    { enabled: fileIds.length > 0 },
  );
  const { data: members = [] } = trpc.members.list.useQuery();
  const userMap = useMemo(
    () =>
      Object.fromEntries(
        members.map((m) => [
          m.userId,
          { name: m.userName, image: m.userImage },
        ]),
      ) as Record<string, { name: string | null; image: string | null }>,
    [members],
  );
  const generateTranscription = trpc.transcriptions.generate.useMutation({
    onSuccess: (result) => {
      if (result.status === "queued") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      utils.transcriptions.statusByFileIds.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDownload = useCallback(
    (fileId: string) => downloadFile(fileId),
    [downloadFile],
  );

  const handleDesktopDrop = useCallback((files: File[]) => {
    setDroppedFiles(files);
    setShowUpload(true);
  }, []);

  const handlePluginAction = useCallback(
    async (
      action: {
        workspacePluginId: string;
        actionId: string;
        label: string;
      },
      target: "file" | "folder",
      targetId: string,
    ) => {
      try {
        const result = await runPluginAction.mutateAsync({
          workspacePluginId: action.workspacePluginId,
          actionId: action.actionId,
          target,
          targetId,
        });

        toast.success(result.message);
        if (result.downloadUrl) {
          window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        toast.error((err as Error).message);
      }
    },
    [runPluginAction],
  );

  const onDrop = useCallback(
    (item: { id: string; type: "file" | "folder" }, targetFolderId: string) => {
      handleDrop(item, targetFolderId);
    },
    [handleDrop],
  );

  const filterColumns = useMemo<FilterColumnDef[]>(() => {
    const cols: FilterColumnDef[] = [
      {
        id: "type",
        type: "option",
        label: "File Type",
        icon: FileLucide,
        options: [
          { label: "Images", value: "image" },
          { label: "Documents", value: "document" },
          { label: "Videos", value: "video" },
          { label: "Audio", value: "audio" },
          { label: "Archives", value: "archive" },
          { label: "Other", value: "other" },
        ],
      },
      {
        id: "date",
        type: "date",
        label: "Upload Date",
        icon: CalendarDays,
      },
    ];
    if (allTags.length > 0) {
      cols.push({
        id: "tags",
        type: "option",
        label: "Tags",
        icon: Tag,
        options: allTags.map((t) => ({
          label: t.name,
          value: t.slug,
          color: t.color,
        })),
      });
    }
    return cols;
  }, [allTags]);

  const folders = folderList ?? [];
  const files = fileList?.items ?? [];
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div>
      {/* Sticky top bar */}
      <ExplorerHeader
        breadcrumbs={breadcrumbs}
        onNavigateHome={() => router.push(`/w/${workspace.slug}`)}
        onNavigateFolder={(id) =>
          router.push(`/w/${workspace.slug}/folder/${id}`)
        }
        onCreateFolder={() => setShowCreateFolder(true)}
        onManageTags={() => setShowManageTags(true)}
        onUpload={() => setShowUpload(true)}
      />

      {/* Filter bar */}
      <div className="px-6 pt-4 flex items-center">
        {filterColumns.length > 0 && (
          <DataFilter
            columns={filterColumns}
            activeFilters={{
              tags: selectedTagIds,
              type: selectedFileTypes,
              date: selectedDates,
            }}
            onFilterChange={(columnId, values) => {
              if (columnId === "tags") {
                setSelectedTagIds(values.length > 0 ? values : null);
              } else if (columnId === "type") {
                setSelectedFileTypes(values.length > 0 ? values : null);
              } else if (columnId === "date") {
                setSelectedDates(values.length > 0 ? values : null);
              }
            }}
            onClearAll={() => {
              setSelectedTagIds(null);
              setSelectedFileTypes(null);
              setSelectedDates(null);
            }}
          />
        )}
        <FileViewToggle
          fileView={fileView}
          onChange={(v) => setFileView(v)}
          className="ml-auto"
        />
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-4">
        {isLoading ? (
          <ExplorerSkeleton view={fileView} />
        ) : isEmpty ? (
          <EmptyState onUpload={() => setShowUpload(true)} />
        ) : fileView === "grid" ? (
          <div className="space-y-4">
            {folders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {folders.map((folder) => (
                  <FolderGridCard
                    key={folder.id}
                    folder={folder}
                    pluginActions={folderPluginActions}
                    onClick={() =>
                      router.push(`/w/${workspace.slug}/folder/${folder.id}`)
                    }
                    onRename={() =>
                      setRenameTarget({
                        id: folder.id,
                        name: folder.name,
                        type: "folder",
                      })
                    }
                    onShare={() =>
                      setShareTarget({
                        id: folder.id,
                        name: folder.name,
                        type: "folder",
                      })
                    }
                    onTrack={() =>
                      setTrackTarget({
                        id: folder.id,
                        name: folder.name,
                        type: "folder",
                      })
                    }
                    onDelete={() => deleteFolder.mutate({ id: folder.id })}
                    onPluginAction={(action) =>
                      handlePluginAction(action, "folder", folder.id)
                    }
                  />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {files.map((file) => (
                <FileGridCard
                  key={file.id}
                  file={file}
                  uploader={userMap[file.userId]}
                  transcriptionStatus={transcriptionStatuses[file.id]}
                  pluginActions={filePluginActions}
                  onClick={() =>
                    router.push(`/w/${workspace.slug}/file/${file.id}`)
                  }
                  onDownload={() => handleDownload(file.id)}
                  onRename={() =>
                    setRenameTarget({
                      id: file.id,
                      name: file.name,
                      type: "file",
                    })
                  }
                  onShare={() =>
                    setShareTarget({
                      id: file.id,
                      name: file.name,
                      type: "file",
                    })
                  }
                  onTrack={() =>
                    setTrackTarget({
                      id: file.id,
                      name: file.name,
                      type: "file",
                    })
                  }
                  onEditTags={() => setTagTarget(file.id)}
                  onDelete={() => deleteFile.mutate({ id: file.id })}
                  onPluginAction={(action) =>
                    handlePluginAction(action, "file", file.id)
                  }
                  onViewTranscription={() =>
                    setTranscriptionTarget({
                      id: file.id,
                      name: file.name,
                    })
                  }
                  onGenerateTranscription={() =>
                    generateTranscription.mutate({ fileId: file.id })
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_40px] sm:grid-cols-[1fr_100px_140px_40px] gap-4 px-4 py-2 border-b bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                Name
              </span>
              <span className="hidden sm:block text-xs font-medium text-muted-foreground">
                Size
              </span>
              <span className="hidden sm:block text-xs font-medium text-muted-foreground">
                Modified
              </span>
              <span />
            </div>

            {/* Folders */}
            {folders.map((folder) => (
              <FolderRowContent
                key={folder.id}
                folder={folder}
                pluginActions={folderPluginActions}
                onDrop={onDrop}
                onClick={() =>
                  router.push(`/w/${workspace.slug}/folder/${folder.id}`)
                }
                onRename={() =>
                  setRenameTarget({
                    id: folder.id,
                    name: folder.name,
                    type: "folder",
                  })
                }
                onShare={() =>
                  setShareTarget({
                    id: folder.id,
                    name: folder.name,
                    type: "folder",
                  })
                }
                onTrack={() =>
                  setTrackTarget({
                    id: folder.id,
                    name: folder.name,
                    type: "folder",
                  })
                }
                onDelete={() => deleteFolder.mutate({ id: folder.id })}
                onPluginAction={(action) =>
                  handlePluginAction(action, "folder", folder.id)
                }
              />
            ))}

            {/* Files */}
            {files.map((file) => (
              <FileRowContent
                key={file.id}
                file={file}
                uploader={userMap[file.userId]}
                tags={fileTagsMap[file.id] ?? []}
                transcriptionStatus={transcriptionStatuses[file.id]}
                pluginActions={filePluginActions}
                onClick={() =>
                  router.push(`/w/${workspace.slug}/file/${file.id}`)
                }
                onDownload={() => handleDownload(file.id)}
                onRename={() =>
                  setRenameTarget({
                    id: file.id,
                    name: file.name,
                    type: "file",
                  })
                }
                onShare={() =>
                  setShareTarget({
                    id: file.id,
                    name: file.name,
                    type: "file",
                  })
                }
                onTrack={() =>
                  setTrackTarget({
                    id: file.id,
                    name: file.name,
                    type: "file",
                  })
                }
                onEditTags={() => setTagTarget(file.id)}
                onDelete={() => deleteFile.mutate({ id: file.id })}
                onPluginAction={(action) =>
                  handlePluginAction(action, "file", file.id)
                }
                onViewTranscription={() =>
                  setTranscriptionTarget({
                    id: file.id,
                    name: file.name,
                  })
                }
                onGenerateTranscription={() =>
                  generateTranscription.mutate({ fileId: file.id })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop file drop overlay */}
      <DesktopDropOverlay onFilesDropped={handleDesktopDrop} />

      {/* Dialogs */}
      <UploadDialog
        open={showUpload}
        onOpenChange={(open) => {
          setShowUpload(open);
          if (!open) setDroppedFiles(undefined);
        }}
        folderId={folderId}
        initialFiles={droppedFiles}
      />
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        parentId={folderId}
      />
      {renameTarget && (
        <RenameDialog
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          target={renameTarget}
        />
      )}
      {shareTarget && (
        <ShareDialog
          open={!!shareTarget}
          onOpenChange={(open) => !open && setShareTarget(null)}
          target={shareTarget}
        />
      )}
      {trackTarget && (
        <CreateTrackedLinkDialog
          open={!!trackTarget}
          onOpenChange={(open) => !open && setTrackTarget(null)}
          target={trackTarget}
        />
      )}
      {transcriptionTarget && (
        <TranscriptionViewer
          open={!!transcriptionTarget}
          onOpenChange={(open) => !open && setTranscriptionTarget(null)}
          file={transcriptionTarget}
        />
      )}
      <ManageTagsDialog
        open={showManageTags}
        onOpenChange={setShowManageTags}
      />
      {tagTarget && (
        <FileTagsDialog
          open={!!tagTarget}
          onOpenChange={(open) => !open && setTagTarget(null)}
          fileId={tagTarget}
        />
      )}
    </div>
  );
}
