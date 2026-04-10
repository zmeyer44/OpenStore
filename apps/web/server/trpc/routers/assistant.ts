import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  assistantConversations,
  assistantMessages,
} from "@locker/database";
import { createRouter, workspaceProcedure } from "../init";

export const assistantRouter = createRouter({
  conversations: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: assistantConversations.id,
        title: assistantConversations.title,
        model: assistantConversations.model,
        createdAt: assistantConversations.createdAt,
        updatedAt: assistantConversations.updatedAt,
      })
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.workspaceId, ctx.workspaceId),
          eq(assistantConversations.userId, ctx.userId),
        ),
      )
      .orderBy(desc(assistantConversations.updatedAt));
  }),

  conversation: workspaceProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .select({
          id: assistantConversations.id,
          title: assistantConversations.title,
          model: assistantConversations.model,
          createdAt: assistantConversations.createdAt,
          updatedAt: assistantConversations.updatedAt,
        })
        .from(assistantConversations)
        .where(
          and(
            eq(assistantConversations.id, input.conversationId),
            eq(assistantConversations.workspaceId, ctx.workspaceId),
            eq(assistantConversations.userId, ctx.userId),
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
          id: assistantMessages.id,
          role: assistantMessages.role,
          parts: assistantMessages.parts,
          attachments: assistantMessages.attachments,
          metadata: assistantMessages.metadata,
          createdAt: assistantMessages.createdAt,
        })
        .from(assistantMessages)
        .where(eq(assistantMessages.conversationId, conversation.id))
        .orderBy(asc(assistantMessages.createdAt));

      return { ...conversation, messages };
    }),

  createConversation: workspaceProcedure
    .input(
      z.object({
        title: z.string().max(255).optional(),
        model: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .insert(assistantConversations)
        .values({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title ?? null,
          model: input.model ?? null,
        })
        .returning();

      return conversation;
    }),

  deleteConversation: workspaceProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [conv] = await ctx.db
        .select({ id: assistantConversations.id })
        .from(assistantConversations)
        .where(
          and(
            eq(assistantConversations.id, input.conversationId),
            eq(assistantConversations.workspaceId, ctx.workspaceId),
            eq(assistantConversations.userId, ctx.userId),
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
        .delete(assistantConversations)
        .where(eq(assistantConversations.id, conv.id));

      return { success: true };
    }),

  updateTitle: workspaceProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        title: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [conv] = await ctx.db
        .update(assistantConversations)
        .set({ title: input.title, updatedAt: new Date() })
        .where(
          and(
            eq(assistantConversations.id, input.conversationId),
            eq(assistantConversations.workspaceId, ctx.workspaceId),
            eq(assistantConversations.userId, ctx.userId),
          ),
        )
        .returning();

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return conv;
    }),
});
