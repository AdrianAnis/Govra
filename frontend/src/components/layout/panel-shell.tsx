"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PanelNav } from "@/components/layout/panel-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PANEL_SECTIONS,
  type PanelNavItem,
  type PanelSection,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ON_DARK_BUTTON = "text-secondary-fg hover:bg-secondary-fg/10";

interface PanelSectionProps {
  title: string;
  items: readonly PanelNavItem[];
}

function PanelSidebar({ title, items }: PanelSectionProps) {
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
        {!collapsed && <span className="px-3 font-bold">{title}</span>}
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
    </aside>
  );
}

function PanelMobileBar({ title, items }: PanelSectionProps) {
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
        </SheetContent>
      </Sheet>
      <span className="font-bold">{title}</span>
    </header>
  );
}

function PanelShell({ section, children }: { section: PanelSection; children: ReactNode }) {
  const { title, items } = PANEL_SECTIONS[section];

  return (
    <div className="flex min-h-dvh">
      <PanelSidebar title={title} items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelMobileBar title={title} items={items} />
        <main id="konten" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { PanelShell };
