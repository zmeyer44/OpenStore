import { createBashTools } from "./bash";
import { createFileTools } from "./files";
import { createFolderTools } from "./folders";
import { createShareTools } from "./shares";
import { createTagTools } from "./tags";
import { createWorkspaceTools } from "./workspace";
import { createPluginTools } from "./plugins";
import type { AssistantToolContext } from "./types";

export type { AssistantToolContext } from "./types";

/**
 * Create all AI assistant tools for the given workspace context.
 * Each tool group wraps existing business logic (file, folder, share, etc.)
 * and exposes it as AI SDK tool definitions.
 */
export function createAssistantTools(ctx: AssistantToolContext) {
  return {
    ...createBashTools(ctx),
    ...createFileTools(ctx),
    ...createFolderTools(ctx),
    ...createShareTools(ctx),
    ...createTagTools(ctx),
    ...createWorkspaceTools(ctx),
    ...createPluginTools(ctx),
  };
}
