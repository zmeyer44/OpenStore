import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure } from "../init";
import {
  users,
  sessions,
  accounts,
  workspaceMembers,
} from "@locker/database";
import { auth } from "../../auth";

export const usersRouter = createRouter({
  /** Get the current user's profile */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctx.userId));

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Check if the user has a password-based account
    const [passwordAccount] = await ctx.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, ctx.userId),
          eq(accounts.providerId, "credential"),
        ),
      )
      .limit(1);

    return {
      ...user,
      hasPassword: !!passwordAccount,
    };
  }),

  /** Update name and/or email */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.name && !input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nothing to update",
        });
      }

      // If changing email, check it's not taken
      if (input.email) {
        const [existing] = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existing && existing.id !== ctx.userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }
      }

      const updateData: Record<string, string> = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;

      await ctx.db.update(users).set(updateData).where(eq(users.id, ctx.userId));

      return { success: true };
    }),

  /** Delete the current user's account */
  deleteAccount: protectedProcedure
    .input(z.object({ confirm: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      // Remove workspace memberships (cascading will handle files via workspace deletion policies)
      await ctx.db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.userId, ctx.userId));

      // Delete sessions
      await ctx.db.delete(sessions).where(eq(sessions.userId, ctx.userId));

      // Delete accounts
      await ctx.db.delete(accounts).where(eq(accounts.userId, ctx.userId));

      // Delete user
      await ctx.db.delete(users).where(eq(users.id, ctx.userId));

      return { success: true };
    }),
});
