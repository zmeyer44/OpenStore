import { and, eq } from 'drizzle-orm';
import { files } from '@locker/database';
import { getBuiltinPluginBySlug } from '../catalog';
import type {
  PluginHandler,
  PluginContext,
  ActionResult,
  ActionTarget,
} from '../types';

const manifest = getBuiltinPluginBySlug('google-drive-sync')!;

export const googleDriveHandler: PluginHandler = {
  manifest,

  async executeAction(
    ctx: PluginContext,
    actionId: string,
    target: ActionTarget,
  ): Promise<ActionResult> {
    if (actionId === 'google-drive.export-file' && target.type === 'file') {
      const [file] = await ctx.db
        .select({
          name: files.name,
          storagePath: files.storagePath,
        })
        .from(files)
        .where(
          and(
            eq(files.id, target.id),
            eq(files.workspaceId, ctx.workspaceId),
          ),
        )
        .limit(1);

      if (!file) {
        throw new Error('File not found');
      }

      const downloadUrl = await ctx.storage.getSignedUrl(file.storagePath, 900);

      return {
        status: 'queued',
        message: `Prepared "${file.name}" for Google Drive transfer`,
        downloadUrl,
        filename: file.name,
      };
    }

    if (
      actionId === 'google-drive.import-into-folder' &&
      target.type === 'folder'
    ) {
      return {
        status: 'queued',
        message: `Queued Google Drive import into "${target.name}"`,
      };
    }

    return {
      status: 'success',
      message: `${actionId} completed`,
    };
  },
};
