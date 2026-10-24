"use client";

import Link from "next/link";
import { Menu, MenuContent, MenuLinkItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import type { SessionUser } from "@/lib/data/session";
import { PROFILE, REPORTER_HOME } from "@/lib/routes";

function UserMenu({ user }: { user: SessionUser }) {
  return (
    <Menu>
      <MenuTrigger
        aria-label="Menu akun"
        className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-fg transition-colors duration-150 hover:bg-primary"
      >
        {user.initials}
      </MenuTrigger>
      <MenuContent>
        <div className="flex flex-col gap-0.5 px-3 py-2.5">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-fg-muted">{user.email}</p>
        </div>
        <MenuSeparator />
        <MenuLinkItem render={<Link href={PROFILE} />}>Profil</MenuLinkItem>
        <MenuLinkItem render={<Link href={REPORTER_HOME} />}>Laporan saya</MenuLinkItem>
        <MenuSeparator />
        <MenuLinkItem render={<a href="/api/mock/keluar" />}>Keluar</MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}

export { UserMenu };
