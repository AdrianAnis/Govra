"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { isActivePath, type PanelNavItem } from "@/lib/navigation";
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

  return (
    <nav aria-label="Navigasi panel">
      <ul className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActivePath(pathname, href, exact);
          return (
            <li key={href}>
              <NavLink
                href={href}
                onFollow={onNavigate}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-ui",
                  collapsed && "justify-center",
                  active ? TONES[tone].active : TONES[tone].idle,
                )}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className={cn(collapsed && "sr-only")}>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { PanelNav };
