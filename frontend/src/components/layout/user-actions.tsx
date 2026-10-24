"use client";

import { NavLink } from "@/components/layout/nav-link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import type { Notification } from "@/lib/data/notifications";
import type { SessionUser } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { REPORT_NEW, PROFILE } from "@/lib/routes";

interface UserActionsProps {
  user: SessionUser;
  notifications: readonly Notification[];
}

function ReportLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavLink
      href={REPORT_NEW}
      onFollow={onNavigate}
      className={cn(buttonVariants({ variant: "primary" }), "min-w-32 px-8")}
    >
      Lapor
    </NavLink>
  );
}

function UserActions({ user, notifications }: UserActionsProps) {
  return (
    <>
      <NotificationBell notifications={notifications} />
      <ReportLink />
      <UserMenu user={user} />
    </>
  );
}

function MobileAccount({ user, onNavigate }: { user: SessionUser; onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-fg">
          {user.initials}
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">{user.name}</span>
          <span className="text-sm text-fg-muted">{user.email}</span>
        </span>
      </div>
      <NavLink
        href={PROFILE}
        onFollow={onNavigate}
        className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
      >
        Profil
      </NavLink>
      <a href="/api/mock/keluar" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Keluar
      </a>
      <ReportLink onNavigate={onNavigate} />
    </div>
  );
}

export { MobileAccount, UserActions };
