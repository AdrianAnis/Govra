"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { isActivePath, type PanelNavItem } from "@/lib/navigation";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";

const TONES = {
  dark: {
    idle: "text-secondary-fg/80 hover:bg-secondary-fg/10",
    active: "bg-primary text-primary-fg",
  },
  light: {
    idle: "text-fg hover:bg-primary-soft",
    active: "bg-primary-soft text-primary",
  },
};

interface PanelNavProps {
  items: readonly PanelNavItem[];
  tone: keyof typeof TONES;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function PanelNav({ items, tone, collapsed = false, onNavigate }: PanelNavProps) {
  const pathname = usePathname();
  const { hasTabUnread, markTabVisited } = useNotifications();

  return (
    <nav aria-label="Navigasi panel">
      <ul className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActivePath(pathname, href, exact);
          const unread = hasTabUnread(href);

          return (
            <li key={href}>
              <NavLink
                href={href}
                onFollow={() => {
                  markTabVisited(href);
                  onNavigate?.();
                }}
                title={collapsed ? (unread ? `${label} (Ada informasi baru)` : label) : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-ui relative",
                  collapsed && "justify-center",
                  active ? TONES[tone].active : TONES[tone].idle,
                )}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon aria-hidden className="size-5 shrink-0" />
                  {unread && (
                    <span
                      aria-label="Ada informasi baru"
                      className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500 ring-2 ring-secondary animate-pulse"
                    />
                  )}
                </div>
                <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{label}</span>
                {!collapsed && unread && (
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20 shrink-0 animate-pulse"
                  />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { PanelNav };
