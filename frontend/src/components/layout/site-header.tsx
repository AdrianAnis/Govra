"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { HeaderActions } from "@/components/layout/header-actions";
import { MainNav } from "@/components/layout/main-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileAccount, UserActions } from "@/components/layout/user-actions";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Notification } from "@/lib/data/notifications";
import type { SessionUser } from "@/lib/data/session";
import { MAIN_NAV, MEMBER_NAV } from "@/lib/navigation";
import { REPORTER_HOME } from "@/lib/routes";

interface SiteHeaderProps {
  user: SessionUser | null;
  notifications: readonly Notification[];
}

function SiteHeader({ user, notifications }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const items = user ? MEMBER_NAV : MAIN_NAV;

  return (
    <header className="sticky top-0 z-40 border-b bg-surface">
      <Container className="flex h-16 items-center gap-4">
        <div className="flex flex-1">
          <Wordmark href={user ? REPORTER_HOME : "/"} />
        </div>
        <div className="hidden md:block">
          <MainNav orientation="row" items={items} />
        </div>
        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          {user ? <UserActions user={user} notifications={notifications} /> : <HeaderActions />}
        </div>
        {user && (
          <div className="md:hidden">
            <NotificationBell notifications={notifications} />
          </div>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu aria-hidden />
            <span className="sr-only">Buka menu</span>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4">
              <MainNav orientation="column" items={items} onNavigate={close} />
              {user ? <MobileAccount user={user} onNavigate={close} /> : <HeaderActions onNavigate={close} />}
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}

export { SiteHeader };
