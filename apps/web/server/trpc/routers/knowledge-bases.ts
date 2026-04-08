import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { createRouter, workspaceProcedure } from "../init";
import {
  knowledgeBases,
  kbConversations,
  kbMessages,
  kbFileIngestions,
  tags,
  fileTags,
  files,
  fileTranscriptions,
} from "@locker/database";
import {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
  generateTagSlug,
  isTextIndexable,
} from "@locker/common";
import { TRPCError } from "@trpc/server";
import type { Database } from "@locker/database";
import { createStorageForWorkspace, createStorageForFile } from "../../storage";
import { getHandler, buildPluginContext } from "../../plugins/runtime";
import { ingestFileIntoKB } from "../../knowledge-base/auto-ingest";

async function getKBWithAccess(
  db: Database,
  kbId: string,
  workspaceId: string,
) {
  const [kb] = await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, kbId),
        eq(knowledgeBases.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  if (!kb) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Knowledge base not found",
    });
  }
  return kb;
}

function validatePagePath(pagePath: string): void {
  if (
    pagePath.includes("..") ||
    pagePath.startsWith("/") ||
    !pagePath.endsWith(".md")
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid page path" });
  }
}

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export const knowledgeBasesRouter = createRouter({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: knowledgeBases.id,
        name: knowledgeBases.name,
        description: knowledgeBases.description,
        status: knowledgeBases.status,
        lastIngestedAt: knowledgeBases.lastIngestedAt,
        createdAt: knowledgeBases.createdAt,
        tagId: knowledgeBases.tagId,
        tagName: tags.name,
        tagSlug: tags.slug,
        tagColor: tags.color,
      })
      .from(knowledgeBases)
      .innerJoin(tags, eq(knowledgeBases.tagId, tags.id))
      .where(eq(knowledgeBases.workspaceId, ctx.workspaceId))
      .orderBy(asc(knowledgeBases.name));
  }),

  get: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          id: knowledgeBases.id,
          name: knowledgeBases.name,
          description: knowledgeBases.description,
          schemaPrompt: knowledgeBases.schemaPrompt,
          model: knowledgeBases.model,
          status: knowledgeBases.status,
          lastIngestedAt: knowledgeBases.lastIngestedAt,
          lastLintedAt: knowledgeBases.lastLintedAt,
          wikiStoragePath: knowledgeBases.wikiStoragePath,
          createdAt: knowledgeBases.createdAt,
          tagId: knowledgeBases.tagId,
          tagName: tags.name,
          tagSlug: tags.slug,
          tagColor: tags.color,
        })
        .from(knowledgeBases)
        .innerJoin(tags, eq(knowledgeBases.tagId, tags.id))
        .where(
          and(
            eq(knowledgeBases.id, input.id),
            eq(knowledgeBases.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge base not found",
        });
      }
      return result;
    }),

  create: workspaceProcedure
    .input(createKnowledgeBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify tag belongs to workspace
      const [tag] = await ctx.db
        .select({ id: tags.id, slug: tags.slug })
        .from(tags)
        .where(
          and(eq(tags.id, input.tagId), eq(tags.workspaceId, ctx.workspaceId)),
        );

      if (!tag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      const wikiStoragePath = `${ctx.workspaceId}/.kb/${tag.slug}/wiki/`;

      try {
        const [kb] = await ctx.db
          .insert(knowledgeBases)
          .values({
            workspaceId: ctx.workspaceId,
            tagId: input.tagId,
            createdById: ctx.userId,
            name: input.name,
            description: input.description,
            schemaPrompt: input.schemaPrompt ?? "",
            wikiStoragePath,
          })
          .returning();

        // Initialize index.md and log.md in storage
        const { storage } = await createStorageForWorkspace(ctx.workspaceId);
        await storage.upload({
          path: `${wikiStoragePath}index.md`,
          data: Buffer.from("# Wiki Index\n\nNo pages yet.\n", "utf-8"),
          contentType: "text/markdown",
        });
        await storage.upload({
          path: `${wikiStoragePath}log.md`,
          data: Buffer.from("# Ingestion Log\n", "utf-8"),
          contentType: "text/markdown",
        });

        return kb;
      } catch (err: any) {
        if (err?.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A knowledge base already exists for this tag",
          });
        }
        throw err;
      }
    }),

  update: workspaceProcedure
    .input(updateKnowledgeBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const set: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) set.name = updates.name;
      if (updates.description !== undefined)
        set.description = updates.description;
      if (updates.schemaPrompt !== undefined)
        set.schemaPrompt = updates.schemaPrompt;
      if (updates.model !== undefined) set.model = updates.model;

      const [updated] = await ctx.db
        .update(knowledgeBases)
        .set(set)
        .where(
          and(
            eq(knowledgeBases.id, id),
            eq(knowledgeBases.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge base not found",
        });
      }
      return updated;
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.id, input.id),
            eq(knowledgeBases.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge base not found",
        });
      }
      return { success: true };
    }),

  sources: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      return ctx.db
        .select({
          id: files.id,
          name: files.name,
          mimeType: files.mimeType,
          size: files.size,
          updatedAt: files.updatedAt,
          ingestedAt: kbFileIngestions.ingestedAt,
        })
        .from(fileTags)
        .innerJoin(files, eq(fileTags.fileId, files.id))
        .leftJoin(
          kbFileIngestions,
          and(
            eq(kbFileIngestions.fileId, files.id),
            eq(kbFileIngestions.knowledgeBaseId, input.knowledgeBaseId),
          ),
        )
        .where(eq(fileTags.tagId, kb.tagId))
        .orderBy(asc(files.name));
    }),

  wikiPages: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      const { storage } = await createStorageForWorkspace(ctx.workspaceId);
      try {
        const { data } = await storage.download(
          `${kb.wikiStoragePath}index.md`,
        );
        const indexContent = await streamToString(data);

        const pages: Array<{ path: string; title: string }> = [];
        const linkRegex = /^- \[(.+?)\]\((.+?)\)/gm;
        let match: RegExpExecArray | null;
        while ((match = linkRegex.exec(indexContent)) !== null) {
          pages.push({ title: match[1], path: match[2] });
        }
        return pages;
      } catch {
        return [];
      }
    }),

  wikiPage: workspaceProcedure
    .input(
      z.object({
        knowledgeBaseId: z.string().uuid(),
        pagePath: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      validatePagePath(input.pagePath);
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      const { storage } = await createStorageForWorkspace(ctx.workspaceId);
      try {
        const { data } = await storage.download(
          `${kb.wikiStoragePath}${input.pagePath}`,
        );
        const content = await streamToString(data);
        return { content };
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wiki page not found",
        });
      }
    }),

  updateWikiPage: workspaceProcedure
    .input(
      z.object({
        knowledgeBaseId: z.string().uuid(),
        pagePath: z.string().min(1),
        content: z.string().max(500_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      validatePagePath(input.pagePath);
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      const { storage } = await createStorageForWorkspace(ctx.workspaceId);
      await storage.upload({
        path: `${kb.wikiStoragePath}${input.pagePath}`,
        data: Buffer.from(input.content, "utf-8"),
        contentType: "text/markdown",
      });

      return { success: true };
    }),

  ingest: workspaceProcedure
    .input(
      z.object({
        knowledgeBaseId: z.string().uuid(),
        fileId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      await getKBWithAccess(ctx.db, input.knowledgeBaseId, ctx.workspaceId);

      const result = await ingestFileIntoKB({
        db: ctx.db,
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        knowledgeBaseId: input.knowledgeBaseId,
        fileId: input.fileId,
      });

      if (result.status === "error") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message,
        });
      }
      if (result.status === "skipped") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This file needs to be transcribed first. Install the Document Transcription plugin and transcribe the file.",
        });
      }

      return result;
    }),

  ingestAll: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      if (kb.status === "building") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Knowledge base is already building",
        });
      }

      // Set status to building
      await ctx.db
        .update(knowledgeBases)
        .set({ status: "building", updatedAt: new Date() })
        .where(eq(knowledgeBases.id, kb.id));

      // Get all tagged files
      const taggedFiles = await ctx.db
        .select({
          id: files.id,
          name: files.name,
          mimeType: files.mimeType,
          storagePath: files.storagePath,
          storageConfigId: files.storageConfigId,
        })
        .from(fileTags)
        .innerJoin(files, eq(fileTags.fileId, files.id))
        .where(eq(fileTags.tagId, kb.tagId));

      const handler = getHandler("knowledge-base");
      const ingestFn = handler?.ingest;
      if (!ingestFn) {
        // Reset status since we can't proceed
        await ctx.db
          .update(knowledgeBases)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(knowledgeBases.id, kb.id));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Knowledge base handler not available",
        });
      }

      const pluginCtx = await buildPluginContext({
        db: ctx.db,
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        pluginId: kb.id,
        config: {},
      });

      // Fire-and-forget: process files in the background so the HTTP
      // request returns immediately instead of blocking for minutes.
      // The KB `status` field ("building" → "active"/"error") is the
      // polling mechanism for the client.
      void (async () => {
        let errors = 0;
        try {
          for (const file of taggedFiles) {
            try {
              let fileContent: string;

              if (isTextIndexable(file.mimeType)) {
                const storage = await createStorageForFile(
                  file.storageConfigId,
                );
                const { data } = await storage.download(file.storagePath);
                fileContent = await streamToString(data);
              } else {
                const [transcription] = await ctx.db
                  .select({ content: fileTranscriptions.content })
                  .from(fileTranscriptions)
                  .where(
                    and(
                      eq(fileTranscriptions.fileId, file.id),
                      eq(fileTranscriptions.status, "ready"),
                    ),
                  )
                  .limit(1);

                if (!transcription?.content) {
                  errors++;
                  continue;
                }
                fileContent = transcription.content;
              }

              await ingestFn(pluginCtx, {
                knowledgeBaseId: kb.id,
                fileId: file.id,
                fileName: file.name,
                fileContent,
                wikiStoragePath: kb.wikiStoragePath,
                schemaPrompt: kb.schemaPrompt,
              });

              // Record per-file ingestion
              await ctx.db
                .insert(kbFileIngestions)
                .values({
                  knowledgeBaseId: kb.id,
                  fileId: file.id,
                  status: "ingested",
                  ingestedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: [
                    kbFileIngestions.knowledgeBaseId,
                    kbFileIngestions.fileId,
                  ],
                  set: { status: "ingested", ingestedAt: new Date() },
                });
            } catch {
              errors++;
            }
          }

          await ctx.db
            .update(knowledgeBases)
            .set({
              status: "active",
              lastIngestedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(knowledgeBases.id, kb.id));
        } catch {
          // If the whole loop blows up, mark as error so it doesn't stay
          // stuck in "building" forever.
          await ctx.db
            .update(knowledgeBases)
            .set({ status: "error", updatedAt: new Date() })
            .where(eq(knowledgeBases.id, kb.id))
            .catch(() => {});
        }
      })();

      return { status: "building", totalFiles: taggedFiles.length };
    }),

  lint: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const kb = await getKBWithAccess(
        ctx.db,
        input.knowledgeBaseId,
        ctx.workspaceId,
      );

      const handler = getHandler("knowledge-base");
      if (!handler?.lint) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Knowledge base handler not available",
        });
      }

      const pluginCtx = await buildPluginContext({
        db: ctx.db,
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        pluginId: kb.id,
        config: {},
      });

      const result = await handler.lint(pluginCtx, {
        knowledgeBaseId: kb.id,
        wikiStoragePath: kb.wikiStoragePath,
        schemaPrompt: kb.schemaPrompt,
      });

      await ctx.db
        .update(knowledgeBases)
        .set({ lastLintedAt: new Date(), updatedAt: new Date() })
        .where(eq(knowledgeBases.id, kb.id));

      return result;
    }),

  conversations: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await getKBWithAccess(ctx.db, input.knowledgeBaseId, ctx.workspaceId);

      return ctx.db
        .select({
          id: kbConversations.id,
          title: kbConversations.title,
          createdAt: kbConversations.createdAt,
          updatedAt: kbConversations.updatedAt,
        })
        .from(kbConversations)
        .where(
          and(
            eq(kbConversations.knowledgeBaseId, input.knowledgeBaseId),
            eq(kbConversations.userId, ctx.userId),
          ),
        )
        .orderBy(desc(kbConversations.updatedAt));
    }),

  conversation: workspaceProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .select({
          id: kbConversations.id,
          title: kbConversations.title,
          knowledgeBaseId: kbConversations.knowledgeBaseId,
          createdAt: kbConversations.createdAt,
        })
        .from(kbConversations)
        .innerJoin(
          knowledgeBases,
          eq(kbConversations.knowledgeBaseId, knowledgeBases.id),
        )
        .where(
          and(
            eq(kbConversations.id, input.conversationId),
            eq(kbConversations.userId, ctx.userId),
            eq(knowledgeBases.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const messages = await ctx.db
        .select({
          id: kbMessages.id,
          role: kbMessages.role,
          parts: kbMessages.parts,
          metadata: kbMessages.metadata,
          createdAt: kbMessages.createdAt,
        })
        .from(kbMessages)
        .where(eq(kbMessages.conversationId, conversation.id))
        .orderBy(asc(kbMessages.createdAt));

      return { ...conversation, messages };
    }),

  createConversation: workspaceProcedure
    .input(
      z.object({
        knowledgeBaseId: z.string().uuid(),
        title: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getKBWithAccess(ctx.db, input.knowledgeBaseId, ctx.workspaceId);

      const [conversation] = await ctx.db
        .insert(kbConversations)
        .values({
          knowledgeBaseId: input.knowledgeBaseId,
          userId: ctx.userId,
          title: input.title ?? null,
        })
        .returning();

      return conversation;
    }),

  deleteConversation: workspaceProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify conversation belongs to a KB in the current workspace
      const [conv] = await ctx.db
        .select({ id: kbConversations.id })
        .from(kbConversations)
        .innerJoin(
          knowledgeBases,
          eq(kbConversations.knowledgeBaseId, knowledgeBases.id),
        )
        .where(
          and(
            eq(kbConversations.id, input.conversationId),
            eq(kbConversations.userId, ctx.userId),
            eq(knowledgeBases.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      await ctx.db
        .delete(kbConversations)
        .where(eq(kbConversations.id, conv.id));

      return { success: true };
    }),
});
