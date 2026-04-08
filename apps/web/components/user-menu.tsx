"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Settings,
  LogOut,
  Monitor,
  Sun,
  Moon,
  Ellipsis,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

type UserMenuProps = {
  user: { name?: string | null; email: string; image?: string | null };
  collapsed: boolean;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-all",
            theme === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={opt.label}
        >
          <opt.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  href,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  href?: string;
  right?: React.ReactNode;
}) {
  const classes = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    "text-foreground hover:bg-accent",
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        <span className="flex-1">{label}</span>
        {right ?? <Icon className="size-4 text-muted-foreground" />}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      <span className="flex-1 text-left">{label}</span>
      {right ?? <Icon className="size-4 text-muted-foreground" />}
    </button>
  );
}

export function UserMenu({ user, collapsed }: UserMenuProps) {
  const router = useRouter();
  const displayName = user.name || user.email.split("@")[0];

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const trigger = (
    <PopoverTrigger
      className={cn(
        "flex items-center gap-2 rounded-lg transition-colors hover:bg-accent outline-none",
        collapsed ? "size-8 justify-center" : "w-full p-1.5",
      )}
    >
      <Avatar
        name={displayName}
        src={user.image}
        width={28}
        className="size-7 shrink-0 rounded-full"
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left text-sm font-medium">
            {displayName}
          </span>
          <Ellipsis className="size-4 shrink-0 text-muted-foreground" />
        </>
      )}
    </PopoverTrigger>
  );

  return (
    <Popover>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {displayName}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <PopoverContent
        side={collapsed ? "right" : "top"}
        align="start"
        sideOffset={8}
        className="w-64 p-0"
      >
        {/* User header */}
        <div className="flex items-center gap-3 p-3">
          <Avatar
            name={displayName}
            src={user.image}
            width={32}
            className="size-8 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <button
            onClick={() => router.push("/settings/account")}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Account settings"
          >
            <Settings className="size-4" />
          </button>
        </div>

        <Separator />

        {/* Menu items */}
        <div className="p-1.5">
          <MenuRow
            icon={Sun}
            label="Theme"
            onClick={() => {}}
            right={<ThemeToggle />}
          />
        </div>

        <Separator />

        <div className="p-1.5">
          <MenuRow icon={Settings} label="Account Settings" href="/settings/account" />
          <MenuRow icon={LogOut} label="Log Out" onClick={handleSignOut} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
