import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc/root';

export const trpc = createTRPCReact<AppRouter>();
