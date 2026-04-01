import { createRouter } from './init';
import { filesRouter } from './routers/files';
import { foldersRouter } from './routers/folders';
import { sharesRouter } from './routers/shares';
import { uploadLinksRouter } from './routers/upload-links';
import { storageRouter } from './routers/storage';
import { workspacesRouter } from './routers/workspaces';
import { membersRouter } from './routers/members';

export const appRouter = createRouter({
  files: filesRouter,
  folders: foldersRouter,
  shares: sharesRouter,
  uploadLinks: uploadLinksRouter,
  storage: storageRouter,
  workspaces: workspacesRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
