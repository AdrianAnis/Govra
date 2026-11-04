"use client";

import { Container } from "@/components/layout/container";
import { HeaderActions } from "@/components/layout/header-actions";
import { MainNav } from "@/components/layout/main-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { UserActions } from "@/components/layout/user-actions";
import { Wordmark } from "@/components/layout/wordmark";
import type { Notification } from "@/lib/data/notifications";
import type { SessionUser } from "@/lib/data/session";
import { MAIN_NAV, MEMBER_NAV } from "@/lib/navigation";
import { ROLE_HOME } from "@/lib/session";

interface SiteHeaderProps {
  user: SessionUser | null;
  notifications: readonly Notification[];
}

function SiteHeader({ user, notifications }: SiteHeaderProps) {
  const reporter = user?.role === "pelapor";
  const items = reporter ? MEMBER_NAV : MAIN_NAV;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-surface">
        <Container className="flex h-14 sm:h-16 items-center gap-4">
          <div className="flex flex-1 items-center max-md:justify-center md:justify-start">
            <Wordmark href={user ? ROLE_HOME[user.role] : "/"} />
          </div>
          <div className="hidden md:block">
            <MainNav orientation="row" items={items} />
          </div>
          <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
            {user ? <UserActions user={user} notifications={notifications} /> : <HeaderActions />}
          </div>
        </Container>
      </header>

      <MobileBottomNav user={user} notifications={notifications} />
    </>
  );
}

export { SiteHeader };
