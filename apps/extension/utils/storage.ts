import { storage } from "wxt/utils/storage";

// Whether the user has completed the /extension-signin handshake. We don't
// store the auth token itself — better-auth keeps it as an HttpOnly cookie on
// the web host and the service worker rides that cookie via host_permissions.
export const signedInStore = storage.defineItem<boolean>(
  "local:locker:signedIn",
  {
    fallback: false,
  },
);

// Last-selected workspace slug, so the popup and intercept dialog default to
// the same workspace across sessions.
export const activeWorkspaceSlugStore = storage.defineItem<string | null>(
  "local:locker:activeWorkspaceSlug",
  { fallback: null },
);

export async function isSignedIn(): Promise<boolean> {
  return signedInStore.getValue();
}

export async function setSignedIn(value: boolean): Promise<void> {
  await signedInStore.setValue(value);
}

export async function getActiveWorkspaceSlug(): Promise<string | null> {
  return activeWorkspaceSlugStore.getValue();
}

export async function setActiveWorkspaceSlug(
  slug: string | null,
): Promise<void> {
  await activeWorkspaceSlugStore.setValue(slug);
}
