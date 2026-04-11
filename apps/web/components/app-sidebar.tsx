"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderOpen,
  Share2,
  Upload,
  Settings,
  Users,
  Key,
  BarChart3,
  Puzzle,
  TerminalSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronsUpDown,
  BookOpen,
  Brain,
  MessageSquare,
  Bot,
  User,
  Boxes,
  Bell,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/assets/logo";
import { trpc } from "@/lib/trpc/client";
import { StorageUsage } from "./storage-usage";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Maps plugin manifest icon names to Lucide components.
 * Add entries here when a plugin uses a new icon name in its sidebarItem.
 * Falls back to `Puzzle` if the icon name isn't found.
 */
const SIDEBAR_ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  brain: Brain,
  "message-square": MessageSquare,
  bot: Bot,
  puzzle: Puzzle,
  "bar-chart": BarChart3,
  terminal: TerminalSquare,
  settings: Settings,
  folder: FolderOpen,
};

type SidebarArea = "workspace" | "account";

/** Route suffixes (relative to workspace prefix) that auto-collapse the sidebar. */
const AUTO_COLLAPSE_ROUTES = ["/chat"];

function NavItem({
  href,
  onClick,
  icon: Icon,
  label,
  isActive,
  collapsed,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  collapsed: boolean;
}) {
  const classes = cn(
    "group/nav relative flex h-8 items-center gap-2 rounded-lg p-2 text-sm transition-colors",
    isActive
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
    collapsed ? "w-8 justify-center" : "w-full",
  );

  const content = onClick ? (
    <button onClick={onClick} className={classes}>
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  ) : (
    <Link href={href!} className={classes}>
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-0.5">
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          collapsed ? "h-0" : "h-6",
        )}
      >
        <div className="flex h-6 items-center px-2 text-xs font-medium text-muted-foreground">
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AppSidebar({
  user,
}: {
  user: { name?: string | null; email: string; image?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [collapsed, setCollapsed] = useState(false);
  const savedCollapsedRef = useRef(false);
  const isOnAutoCollapseRouteRef = useRef(false);

  const slugMatch = pathname.match(/\/w\/([^/]+)/);
  const slug = slugMatch?.[1] ?? "";
  const prefix = `/w/${slug}`;

  const isAutoCollapseRoute = AUTO_COLLAPSE_ROUTES.some((route) =>
    pathname.startsWith(`${prefix}${route}`),
  );

  useEffect(() => {
    if (isAutoCollapseRoute && !isOnAutoCollapseRouteRef.current) {
      savedCollapsedRef.current = collapsed;
      isOnAutoCollapseRouteRef.current = true;
      setCollapsed(true);
    } else if (!isAutoCollapseRoute && isOnAutoCollapseRouteRef.current) {
      isOnAutoCollapseRouteRef.current = false;
      setCollapsed(savedCollapsedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture collapsed at the moment of route change only
  }, [isAutoCollapseRoute]);

  const area: SidebarArea = useMemo(() => {
    if (pathname.startsWith("/settings")) return "account";
    return "workspace";
  }, [pathname]);

  const isWorkspace = area === "workspace";

  const { data: workspacesList } = trpc.workspaces.list.useQuery();
  const currentWorkspace = workspacesList?.find((w) => w.slug === slug) ?? null;

  const { data: installedPlugins } = trpc.plugins.installed.useQuery(
    undefined,
    { enabled: isWorkspace },
  );

  const pluginNavItems = (installedPlugins ?? [])
    .filter((p) => p.status === "active" && p.manifest.sidebarItem)
    .map((p) => {
      const sb = p.manifest.sidebarItem!;
      return {
        href: `${prefix}${sb.path}`,
        label: sb.label,
        icon: SIDEBAR_ICON_MAP[sb.icon] ?? Puzzle,
        key: `plugin-${p.pluginSlug}`,
      };
    });

  const toggleButton = (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      <div className="relative grid size-5 place-items-center">
        <PanelLeftClose
          className={cn(
            "absolute size-4 transition-all",
            collapsed ? "scale-0" : "scale-100",
          )}
        />
        <PanelLeftOpen
          className={cn(
            "absolute size-4 transition-all",
            collapsed ? "scale-100" : "scale-0",
          )}
        />
      </div>
    </button>
  );

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col justify-between overflow-hidden p-2 transition-all duration-300 ease-in-out",
        collapsed ? "w-[52px]" : "w-[240px]",
      )}
    >
      {/* Top section */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "flex h-12 items-center gap-2 transition-all",
            collapsed ? "justify-center" : "px-1",
          )}
        >
          {!collapsed && (
            <div className="flex flex-1 items-center gap-2 min-w-0">
              {isWorkspace && currentWorkspace ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 min-w-0 rounded-lg p-1 -ml-1 hover:bg-accent transition-colors outline-none">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                      {currentWorkspace.name[0]?.toUpperCase() ?? "W"}
                    </div>
                    <span className="truncate text-sm font-semibold">
                      {currentWorkspace.name}
                    </span>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={4}
                    className="w-56"
                  >
                    {workspacesList?.map((ws) => (
                      <DropdownMenuItem
                        key={ws.id}
                        onSelect={() => {
                          if (ws.id !== currentWorkspace.id) {
                            void utils.invalidate();
                          }
                          router.push(`/w/${ws.slug}`);
                        }}
                        className={
                          ws.id === currentWorkspace.id ? "bg-accent" : ""
                        }
                      >
                        <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-xs shrink-0">
                          {ws.name[0]?.toUpperCase() ?? "W"}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => router.push("/onboarding")}
                    >
                      <Plus className="size-4" />
                      Create workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/" className="flex items-center gap-2">
                  <Logo className="size-6 shrink-0 text-foreground" />
                  <span className="text-sm font-semibold">Locker</span>
                </Link>
              )}
            </div>
          )}
          {toggleButton}
        </div>

        {/* Nav sections — context-dependent */}
        <div className="flex flex-col gap-3">
          {isWorkspace ? (
            <WorkspaceNav
              pathname={pathname}
              prefix={prefix}
              collapsed={collapsed}
              pluginNavItems={pluginNavItems}
            />
          ) : (
            <AccountNav
              pathname={pathname}
              collapsed={collapsed}
              workspacesList={workspacesList ?? []}
            />
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-1">
        {/* Storage usage card — only in workspace context */}
        {isWorkspace && !collapsed && (
          <div className="rounded-lg ring-1 ring-border shadow-sm p-2.5 mb-1">
            <StorageUsage />
          </div>
        )}

        {/* User menu */}
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </div>
  );
}

// ── Workspace nav (files, plugins, workspace settings) ───────────────────

function WorkspaceNav({
  pathname,
  prefix,
  collapsed,
  pluginNavItems,
}: {
  pathname: string;
  prefix: string;
  collapsed: boolean;
  pluginNavItems: {
    href: string;
    label: string;
    icon: LucideIcon;
    key: string;
  }[];
}) {
  const navItems = [
    { href: prefix, label: "My Files", icon: FolderOpen, key: "files" },
    {
      href: `${prefix}/chat`,
      label: "AI Assistant",
      icon: Bot,
      key: "chat",
    },
    {
      href: `${prefix}/shared-links`,
      label: "Share Links",
      icon: Share2,
      key: "shares",
    },
    {
      href: `${prefix}/upload-links`,
      label: "Upload Links",
      icon: Upload,
      key: "uploads",
    },
    {
      href: `${prefix}/tracked-links`,
      label: "Tracked Links",
      icon: BarChart3,
      key: "tracked",
    },
    {
      href: `${prefix}/terminal`,
      label: "Terminal",
      icon: TerminalSquare,
      key: "terminal",
    },
  ];

  const pluginSectionItems = [
    ...pluginNavItems,
    {
      href: `${prefix}/plugins`,
      label: "Plugins",
      icon: Puzzle,
      key: "plugins",
    },
  ];

  const settingsItems = [
    {
      href: `${prefix}/settings`,
      label: "Settings",
      icon: Settings,
      key: "settings",
    },
    {
      href: `${prefix}/settings/stores`,
      label: "Stores",
      icon: HardDrive,
      key: "stores",
    },
    {
      href: `${prefix}/settings/members`,
      label: "Members",
      icon: Users,
      key: "members",
    },
    {
      href: `${prefix}/settings/api-keys`,
      label: "API Keys",
      icon: Key,
      key: "api-keys",
    },
  ];

  return (
    <>
      <NavSection label="Files" collapsed={collapsed}>
        {navItems.map((item) => {
          const isActive =
            item.key === "files"
              ? pathname === prefix ||
                pathname.startsWith(`${prefix}/folder`)
              : pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </NavSection>

      <NavSection label="Plugins" collapsed={collapsed}>
        {pluginSectionItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </NavSection>

      <NavSection label="Workspace" collapsed={collapsed}>
        {settingsItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </NavSection>
    </>
  );
}

// ── Account nav (settings + workspace picker) ────────────────────────────

function AccountNav({
  pathname,
  collapsed,
  workspacesList,
}: {
  pathname: string;
  collapsed: boolean;
  workspacesList: { id: string; name: string; slug: string; role: string }[];
}) {
  const accountItems = [
    {
      href: "/settings/account",
      label: "Account",
      icon: User,
      key: "account",
    },
    {
      href: "/settings/notifications",
      label: "Notifications",
      icon: Bell,
      key: "notifications",
    },
  ];

  return (
    <>
      <NavSection label="Settings" collapsed={collapsed}>
        {accountItems.map((item) => (
          <NavItem
            key={item.key}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </NavSection>

      <NavSection label="Workspaces" collapsed={collapsed}>
        {workspacesList.map((ws) => (
          <NavItem
            key={ws.id}
            href={`/w/${ws.slug}`}
            icon={Boxes}
            label={ws.name}
            isActive={false}
            collapsed={collapsed}
          />
        ))}
        <NavItem
          key="new-workspace"
          href="/onboarding"
          icon={Plus}
          label="New workspace"
          isActive={false}
          collapsed={collapsed}
        />
      </NavSection>
    </>
  );
}
