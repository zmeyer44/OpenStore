'use client';

import { ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function WorkspaceSwitcher({
  currentWorkspace,
}: {
  currentWorkspace: { id: string; name: string; slug: string };
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: workspaces } = trpc.workspaces.list.useQuery();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
                {currentWorkspace.name[0]?.toUpperCase() ?? 'W'}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  /{currentWorkspace.slug}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {workspaces?.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onSelect={() => {
                  if (ws.id !== currentWorkspace.id) {
                    // Invalidate all cached queries so they refetch
                    // with the new workspace's x-workspace-slug header
                    void utils.invalidate();
                  }
                  router.push(`/w/${ws.slug}`);
                }}
                className={ws.id === currentWorkspace.id ? 'bg-accent' : ''}
              >
                <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-xs shrink-0">
                  {ws.name[0]?.toUpperCase() ?? 'W'}
                </div>
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/onboarding')}>
              <Plus />
              Create workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
