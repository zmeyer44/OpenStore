'use client';

import { trpc } from '@/lib/trpc/client';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/utils';

export function StorageUsage() {
  const { data } = trpc.storage.usage.useQuery();

  if (!data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Progress value={data.percentage} />
      <p className="text-xs text-muted-foreground">
        {formatBytes(data.used)} of {formatBytes(data.limit)} used
      </p>
    </div>
  );
}
