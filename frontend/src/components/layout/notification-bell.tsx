"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Notification } from "@/lib/data/notifications";
import { cn } from "@/lib/utils";
import { reportHref, REPORTER_HOME } from "@/lib/routes";

function NotificationBell({ notifications }: { notifications: readonly Notification[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((item) => item.unread).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Bell aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute top-2 right-2 size-2.5 rounded-full bg-primary ring-2 ring-surface" />
        )}
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <p className="font-semibold">Notifikasi</p>
          {unread > 0 && <p className="text-sm text-fg-muted">{unread} baru</p>}
        </div>
        {notifications.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-fg-muted">Belum ada notifikasi.</p>
        ) : (
          <ul className="flex max-h-96 flex-col divide-y overflow-y-auto">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link
                  href={reportHref(item.code)}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-muted"
                >
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.unread ? "bg-primary" : "bg-transparent")}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className={cn("text-sm", item.unread && "font-semibold")}>{item.text}</span>
                    <span className="text-xs text-fg-muted">{item.when}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={REPORTER_HOME}
          onClick={() => setOpen(false)}
          className="block border-t px-5 py-3.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-surface-muted"
        >
          Lihat semua laporan
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationBell };
