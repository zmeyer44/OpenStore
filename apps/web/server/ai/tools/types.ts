import type { Database } from "@locker/database";

/** Context passed to every AI assistant tool factory. */
export interface AssistantToolContext {
  db: Database;
  workspaceId: string;
  userId: string;
  workspaceSlug: string;
}
