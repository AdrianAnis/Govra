"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Notification } from "@/lib/data/notifications";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";
import { reportHref } from "@/lib/routes";

function NotificationBell({ notifications: initialNotifications }: { notifications?: readonly Notification[] }) {
  const [open, setOpen] = useState(false);
  const context = useNotifications();
  const list = context.notifications.length > 0 ? context.notifications : initialNotifications ?? [];
  const unread = context.unreadCount;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      context.markAllAsRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Bell aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute top-2 right-2 size-2.5 rounded-full bg-amber-500 ring-2 ring-surface animate-pulse" />
        )}
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="font-semibold text-sm">Notifikasi</p>
          {unread > 0 && <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{unread} baru</p>}
        </div>
        {list.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-fg-muted">Belum ada notifikasi.</p>
        ) : (
          <ul className="flex max-h-96 flex-col divide-y overflow-y-auto">
            {list.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href || reportHref(item.code)}
                  onClick={() => {
                    context.markAsRead(item.id);
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-muted"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.unread ? "bg-amber-500" : "bg-transparent",
                    )}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className={cn("text-xs leading-snug", item.unread ? "font-semibold text-fg" : "text-fg-muted")}>
                      {item.title || item.text}
                    </span>
                    <span className="text-[11px] text-fg-subtle">{item.when}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/pelapor/notifikasi"
          onClick={() => setOpen(false)}
          className="block border-t px-5 py-3 text-center text-xs font-semibold text-primary transition-colors hover:bg-surface-muted"
        >
          Buka pusat notifikasi
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationBell };
