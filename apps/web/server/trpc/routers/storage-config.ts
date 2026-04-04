import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, workspaceAdminProcedure } from "../init";
import { workspaceStorageConfigs } from "@openstore/database";
import { encryptSecret } from "../../s3/auth";
import {
  createStorageFromConfig,
  type WorkspaceStorageConfig,
} from "@openstore/storage";

const s3CredentialsSchema = z.object({
  provider: z.literal("s3"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
});

const r2CredentialsSchema = z.object({
  provider: z.literal("r2"),
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
});

const vercelCredentialsSchema = z.object({
  provider: z.literal("vercel"),
  readWriteToken: z.string().min(1, "Read/Write Token is required"),
});

const credentialsSchema = z.discriminatedUnion("provider", [
  s3CredentialsSchema,
  r2CredentialsSchema,
  vercelCredentialsSchema,
]);

const saveConfigSchema = z
  .object({
    provider: z.enum(["s3", "r2", "vercel"]),
    bucket: z.string().min(1, "Bucket name is required"),
    region: z.string().optional(),
    endpoint: z.string().optional(),
    credentials: credentialsSchema,
  })
  .refine((data) => data.credentials.provider === data.provider, {
    message: "Credentials provider must match the selected provider",
    path: ["credentials"],
  });

const configSelect = {
  id: workspaceStorageConfigs.id,
  provider: workspaceStorageConfigs.provider,
  bucket: workspaceStorageConfigs.bucket,
  region: workspaceStorageConfigs.region,
  endpoint: workspaceStorageConfigs.endpoint,
  isActive: workspaceStorageConfigs.isActive,
  lastTestedAt: workspaceStorageConfigs.lastTestedAt,
  createdAt: workspaceStorageConfigs.createdAt,
  updatedAt: workspaceStorageConfigs.updatedAt,
} as const;

export const storageConfigRouter = createRouter({
  get: workspaceAdminProcedure.query(async ({ ctx }) => {
    const [config] = await ctx.db
      .select(configSelect)
      .from(workspaceStorageConfigs)
      .where(
        and(
          eq(workspaceStorageConfigs.workspaceId, ctx.workspaceId),
          eq(workspaceStorageConfigs.isActive, true),
        ),
      );

    if (!config) return null;
    return config;
  }),

  save: workspaceAdminProcedure
    .input(saveConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const encryptedCredentials = encryptSecret(
        JSON.stringify(input.credentials),
      );

      const [existing] = await ctx.db
        .select({
          id: workspaceStorageConfigs.id,
          provider: workspaceStorageConfigs.provider,
          bucket: workspaceStorageConfigs.bucket,
        })
        .from(workspaceStorageConfigs)
        .where(
          and(
            eq(workspaceStorageConfigs.workspaceId, ctx.workspaceId),
            eq(workspaceStorageConfigs.isActive, true),
          ),
        );

      const bucketOrProviderChanged =
        existing &&
        (existing.provider !== input.provider ||
          existing.bucket !== input.bucket);

      if (existing && !bucketOrProviderChanged) {
        // Credential-only update (same bucket + provider): update in place.
        const [updated] = await ctx.db
          .update(workspaceStorageConfigs)
          .set({
            region: input.region ?? null,
            endpoint: input.endpoint ?? null,
            encryptedCredentials,
            updatedAt: new Date(),
          })
          .where(eq(workspaceStorageConfigs.id, existing.id))
          .returning(configSelect);

        return updated;
      }

      // Deactivate old + insert new must be atomic so a failed insert
      // doesn't leave the workspace with zero active configs.
      const [created] = await ctx.db.transaction(async (tx) => {
        if (bucketOrProviderChanged) {
          await tx
            .update(workspaceStorageConfigs)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(workspaceStorageConfigs.id, existing.id));
        }

        return tx
          .insert(workspaceStorageConfigs)
          .values({
            workspaceId: ctx.workspaceId,
            provider: input.provider,
            bucket: input.bucket,
            region: input.region ?? null,
            endpoint: input.endpoint ?? null,
            encryptedCredentials,
            isActive: true,
          })
          .returning(configSelect);
      });

      return created;
    }),

  remove: workspaceAdminProcedure.mutation(async ({ ctx }) => {
    // Deactivate rather than delete — existing file references need the
    // config row to remain so reads can still resolve to the correct bucket.
    await ctx.db
      .update(workspaceStorageConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(workspaceStorageConfigs.workspaceId, ctx.workspaceId),
          eq(workspaceStorageConfigs.isActive, true),
        ),
      );

    return { success: true };
  }),

  test: workspaceAdminProcedure
    .input(saveConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const config: WorkspaceStorageConfig = {
        provider: input.provider,
        bucket: input.bucket,
        region: input.region,
        endpoint: input.endpoint,
        credentials: input.credentials,
      };

      try {
        const storage = createStorageFromConfig(config);

        const testPath = `.openstore-connection-test-${Date.now()}`;
        const testData = Buffer.from("connection-test");

        await storage.upload({
          path: testPath,
          data: testData,
          contentType: "text/plain",
        });

        // Best-effort cleanup — don't let a delete failure mask a successful connection test
        await storage.delete(testPath).catch(() => {});

        // Update last tested timestamp on the active config if it exists
        await ctx.db
          .update(workspaceStorageConfigs)
          .set({ lastTestedAt: new Date() })
          .where(
            and(
              eq(workspaceStorageConfigs.workspaceId, ctx.workspaceId),
              eq(workspaceStorageConfigs.isActive, true),
            ),
          );

        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Connection failed: ${(err as Error).message}`,
        });
      }
    }),
});
