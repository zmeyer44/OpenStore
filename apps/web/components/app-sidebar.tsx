'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderOpen,
  Share2,
  Upload,
  LogOut,
  ChevronsUpDown,
  Settings,
  Users,
  Key,
  BarChart3,
  Puzzle,
} from 'lucide-react';
import { Logo } from '@/assets/logo';
import { signOut } from '@/lib/auth/client';
import { trpc } from '@/lib/trpc/client';
import { WorkspaceSwitcher } from './workspace-switcher';
import { StorageUsage } from './storage-usage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export function AppSidebar({
  user,
}: {
  user: { name?: string | null; email: string; image?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract workspace slug from URL path
  const slugMatch = pathname.match(/\/w\/([^/]+)/);
  const slug = slugMatch?.[1] ?? '';

  // Fetch workspace data for the switcher
  const { data: workspacesList } = trpc.workspaces.list.useQuery();
  const currentWorkspace = workspacesList?.find((w) => w.slug === slug) ?? null;
  const prefix = `/w/${slug}`;

  const navItems = [
    { href: prefix, label: 'My Files', icon: FolderOpen, key: 'files' },
    { href: `${prefix}/shared-links`, label: 'Share Links', icon: Share2, key: 'shares' },
    { href: `${prefix}/upload-links`, label: 'Upload Links', icon: Upload, key: 'uploads' },
    { href: `${prefix}/tracked-links`, label: 'Tracked Links', icon: BarChart3, key: 'tracked' },
    { href: `${prefix}/plugins`, label: 'Plugins', icon: Puzzle, key: 'plugins' },
  ];

  const settingsItems = [
    { href: `${prefix}/settings`, label: 'Settings', icon: Settings, key: 'settings' },
    { href: `${prefix}/settings/members`, label: 'Members', icon: Users, key: 'members' },
    { href: `${prefix}/settings/api-keys`, label: 'API Keys', icon: Key, key: 'api-keys' },
  ];

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? 'U';

  return (
    <Sidebar>
      <SidebarHeader>
        {currentWorkspace ? (
          <WorkspaceSwitcher currentWorkspace={currentWorkspace} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <Logo className="size-8 text-primary" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">OpenStore</span>
                    <span className="truncate text-xs text-muted-foreground">
                      File Storage
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.key === 'files'
                    ? pathname === prefix || pathname.startsWith(`${prefix}/folder`)
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Storage</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <StorageUsage />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name ?? ''} />
                    )}
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name ?? user.email.split('@')[0]}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name ?? ''} />
                    )}
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name ?? user.email.split('@')[0]}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    router.push('/login');
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
