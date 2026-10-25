"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { PanelNav } from "@/components/layout/panel-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SessionUser } from "@/lib/data/session";
import {
  PANEL_SECTIONS,
  type PanelNavItem,
  type PanelSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

function sectionLabel(title: string): string {
  return title.split(" · ")[1] ?? title;
}

const ON_DARK_BUTTON = "text-secondary-fg hover:bg-secondary-fg/10";

interface PanelSectionProps {
  title: string;
  items: readonly PanelNavItem[];
  user: SessionUser;
}

function PanelSidebar({ title, items, user }: PanelSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 bg-secondary p-3 text-secondary-fg transition-all duration-150 ease-ui md:flex",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <span className="flex min-w-0 flex-col gap-1 px-3">
            <Logo tone="light" className="h-6" />
            <span className="text-xs font-semibold text-secondary-fg/70">{sectionLabel(title)}</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={ON_DARK_BUTTON}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          <ToggleIcon aria-hidden />
          <span className="sr-only">{collapsed ? "Perluas menu" : "Ciutkan menu"}</span>
        </Button>
      </div>
      <PanelNav items={items} tone="dark" collapsed={collapsed} />
      <div className="mt-auto flex flex-col gap-2 border-t border-secondary-fg/20 pt-3">
        <div className={cn("flex items-center gap-3 px-2", collapsed && "justify-center px-0")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-fg/15 text-sm font-semibold">
            {user.initials}
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="truncate text-xs text-secondary-fg/70">{user.opdName ?? user.email}</span>
            </span>
          )}
        </div>
        <a
          href="/api/mock/keluar"
          className={cn(buttonVariants({ variant: "ghost" }), ON_DARK_BUTTON, "justify-start", collapsed && "justify-center px-0")}
        >
          <LogOut aria-hidden />
          <span className={cn(collapsed && "sr-only")}>Keluar</span>
        </a>
      </div>
    </aside>
  );
}

function PanelMobileBar({ title, items, user }: PanelSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-2 bg-secondary px-3 text-secondary-fg md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className={ON_DARK_BUTTON} />}
        >
          <Menu aria-hidden />
          <span className="sr-only">Buka menu</span>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="px-3">
            <PanelNav items={items} tone="light" onNavigate={() => setOpen(false)} />
          </div>
          <div className="mt-auto flex flex-col gap-2 border-t p-3">
            <p className="px-2 text-sm font-semibold">{user.name}</p>
            <a href="/api/mock/keluar" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
              <LogOut aria-hidden />
              Keluar
            </a>
          </div>
        </SheetContent>
      </Sheet>
      <span className="flex items-center gap-3">
        <Logo className="h-6" />
        <span className="text-sm font-semibold text-fg-muted">{sectionLabel(title)}</span>
      </span>
    </header>
  );
}

function PanelShell({ section, user, children }: { section: PanelSection; user: SessionUser; children: ReactNode }) {
  const { title, items } = PANEL_SECTIONS[section];

  return (
    <div className="flex min-h-dvh">
      <PanelSidebar title={title} items={items} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelMobileBar title={title} items={items} user={user} />
        <main id="konten" tabIndex={-1} className="outline-none flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { PanelShell };
