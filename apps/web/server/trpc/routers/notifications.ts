import { z } from "zod";
import { eq, and, desc, lt, or, sql } from "drizzle-orm";
import { createRouter, protectedProcedure } from "../init";
import { notifications } from "@locker/database";

function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id }),
  ).toString("base64");
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, "base64").toString());
  return { createdAt: new Date(parsed.createdAt), id: parsed.id };
}

export const notificationsRouter = createRouter({
  /** List notifications for the current user, newest first */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const conditions = [eq(notifications.userId, ctx.userId)];

      if (input?.cursor) {
        const { createdAt, id } = decodeCursor(input.cursor);
        conditions.push(
          or(
            lt(notifications.createdAt, createdAt),
            and(
              eq(notifications.createdAt, createdAt),
              lt(notifications.id, id),
            ),
          )!,
        );
      }

      const rows = await ctx.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt), desc(notifications.id))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (rows.length > limit) {
        const next = rows.pop()!;
        nextCursor = encodeCursor(next);
      }

      return { items: rows, nextCursor };
    }),

  /** Count of unread notifications */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.read, false),
        ),
      );

    return result?.count ?? 0;
  }),

  /** Mark a single notification as read */
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.userId),
          ),
        );

      return { success: true };
    }),

  /** Mark all notifications as read */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.read, false),
        ),
      );

    return { success: true };
  }),
});
