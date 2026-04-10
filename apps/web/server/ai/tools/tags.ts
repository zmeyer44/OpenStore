import { tool } from "ai";
import { z } from "zod/v4";
import { eq, and, asc, inArray } from "drizzle-orm";
import { tags, fileTags, files } from "@locker/database";
import { generateTagSlug } from "@locker/common";
import type { AssistantToolContext } from "./types";

export function createTagTools(ctx: AssistantToolContext) {
  return {
    listTags: tool({
      description: "List all tags in the workspace.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await ctx.db
          .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
            color: tags.color,
          })
          .from(tags)
          .where(eq(tags.workspaceId, ctx.workspaceId))
          .orderBy(asc(tags.name));

        return { tags: rows };
      },
    }),

    createTag: tool({
      description: "Create a new tag in the workspace.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Tag name"),
        color: z
          .string()
          .optional()
          .describe("Optional hex color for the tag (e.g. '#ff0000')"),
      }),
      execute: async ({ name, color }) => {
        try {
          const [tag] = await ctx.db
            .insert(tags)
            .values({
              workspaceId: ctx.workspaceId,
              name,
              slug: generateTagSlug(name),
              color: color ?? null,
            })
            .returning();

          return { tag };
        } catch (err: any) {
          if (err?.code === "23505") {
            return { error: "A tag with this name already exists" };
          }
          throw err;
        }
      },
    }),

    tagFile: tool({
      description:
        "Set tags on a file. Replaces all existing tags with the provided list.",
      inputSchema: z.object({
        fileId: z.string().uuid().describe("ID of the file to tag"),
        tagIds: z
          .array(z.string().uuid())
          .describe("Array of tag IDs to apply to the file"),
      }),
      execute: async ({ fileId, tagIds }) => {
        // Validate file exists
        const [file] = await ctx.db
          .select({ id: files.id })
          .from(files)
          .where(
            and(
              eq(files.id, fileId),
              eq(files.workspaceId, ctx.workspaceId),
            ),
          )
          .limit(1);

        if (!file) return { error: "File not found" };

        // Validate tags exist
        const uniqueTagIds = [...new Set(tagIds)] as string[];
        if (uniqueTagIds.length > 0) {
          const validTags = await ctx.db
            .select({ id: tags.id })
            .from(tags)
            .where(
              and(
                inArray(tags.id, uniqueTagIds),
                eq(tags.workspaceId, ctx.workspaceId),
              ),
            );

          if (validTags.length !== uniqueTagIds.length) {
            return { error: "One or more tags not found" };
          }
        }

        // Replace tags in a transaction
        await ctx.db.transaction(async (tx) => {
          await tx
            .delete(fileTags)
            .where(eq(fileTags.fileId, fileId as string));

          if (uniqueTagIds.length > 0) {
            await tx
              .insert(fileTags)
              .values(
                uniqueTagIds.map((tagId) => ({
                  fileId: fileId as string,
                  tagId,
                })),
              );
          }
        });

        // Return updated tags
        const appliedTags = await ctx.db
          .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
            color: tags.color,
          })
          .from(fileTags)
          .innerJoin(tags, eq(fileTags.tagId, tags.id))
          .where(eq(fileTags.fileId, fileId as string));

        return { tags: appliedTags };
      },
    }),
  };
}
