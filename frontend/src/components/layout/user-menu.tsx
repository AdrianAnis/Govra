"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, MenuContent, MenuLinkItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import type { SessionUser } from "@/lib/data/session";
import { PROFILE, REPORTER_HOME } from "@/lib/routes";
import { ROLE_HOME } from "@/lib/session";

function UserMenu({ user }: { user: SessionUser }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Menu>
      <MenuTrigger
        aria-label="Menu akun"
        className="relative grid size-10 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-fg transition-colors duration-150 hover:bg-primary overflow-hidden border border-border"
      >
        {user.avatarUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          user.initials
        )}
      </MenuTrigger>
      <MenuContent>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="relative size-9 rounded-full bg-secondary text-secondary-fg flex items-center justify-center overflow-hidden shrink-0 border border-border">
            {user.avatarUrl && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="size-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xs font-semibold">{user.initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs text-fg-muted truncate">{user.opdName ?? user.email}</p>
          </div>
        </div>
        <MenuSeparator />
        {user.role === "pelapor" ? (
          <>
            <MenuLinkItem render={<Link href={PROFILE} />}>Profil</MenuLinkItem>
            <MenuLinkItem render={<Link href={REPORTER_HOME} />}>Laporan saya</MenuLinkItem>
          </>
        ) : (
          <MenuLinkItem render={<Link href={ROLE_HOME[user.role]} />}>
            {user.role === "dinas" ? "Panel Dinas" : "Panel Admin"}
          </MenuLinkItem>
        )}
        <MenuSeparator />
        <MenuLinkItem render={<a href="/api/auth/keluar" />}>Keluar</MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}

export { UserMenu };
