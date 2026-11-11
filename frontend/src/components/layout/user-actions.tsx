"use client";

import { useState } from "react";
import { NavLink } from "@/components/layout/nav-link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import type { Notification } from "@/lib/data/notifications";
import type { SessionUser } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { REPORT_NEW, PROFILE } from "@/lib/routes";
import { ROLE_HOME } from "@/lib/session";

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
  if (user.role !== "pelapor") {
    return <UserMenu user={user} />;
  }
  return (
    <>
      <NotificationBell notifications={notifications} />
      <ReportLink />
      <UserMenu user={user} />
    </>
  );
}

function MobileAccount({ user, onNavigate }: { user: SessionUser; onNavigate: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex items-center gap-3 px-1">
        <div className="relative size-10 rounded-full bg-secondary text-secondary-fg flex items-center justify-center overflow-hidden shrink-0 border border-border">
          {user.avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-sm font-semibold">{user.initials}</span>
          )}
        </div>
        <span className="flex flex-col min-w-0">
          <span className="font-semibold truncate">{user.name}</span>
          <span className="text-sm text-fg-muted truncate">{user.email}</span>
        </span>
      </div>
      <NavLink
        href={user.role === "pelapor" ? PROFILE : ROLE_HOME[user.role]}
        onFollow={onNavigate}
        className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
      >
        {user.role === "pelapor" ? "Profil" : "Buka panel"}
      </NavLink>
      <a href="/api/auth/keluar" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Keluar
      </a>
      {user.role === "pelapor" && <ReportLink onNavigate={onNavigate} />}
    </div>
  );
}

export { MobileAccount, UserActions };
