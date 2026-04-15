import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/trpc/root';
import { createContext } from '../../../../server/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[trpc] ${path}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
