import { trpc } from "@/lib/trpc/client";

export function useRuntime() {
  return trpc.runtime.capabilities.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
