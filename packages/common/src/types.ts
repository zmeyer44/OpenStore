export type StorageProvider = 'local' | 's3' | 'r2' | 'vercel';

export type FileStatus = 'uploading' | 'ready' | 'failed';

export type ShareLinkAccess = 'view' | 'download';

export type UploadLinkStatus = 'active' | 'expired' | 'revoked';

export type SortField = 'name' | 'size' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

// Workspace types
export const WORKSPACE_ROLES = ['owner', 'admin', 'member'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export type InviteStatus = 'pending' | 'accepted' | 'expired';
