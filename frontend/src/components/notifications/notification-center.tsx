"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Inbox,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";
import type { NotificationCategory } from "@/lib/data/notifications";

interface Props {
  role?: string;
}

export function NotificationCenter({ role = "pemerintah" }: Props) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (selectedFilter === "UNREAD") return item.unread;
      if (selectedFilter === "VERIFIKASI") return item.category === "VERIFIKASI";
      if (selectedFilter === "PROKER") return item.category === "PROKER";
      if (selectedFilter === "LAPORAN") return item.category === "LAPORAN";
      return true;
    });
  }, [notifications, selectedFilter]);

  const countUnread = notifications.filter((i) => i.unread).length;
  const countVerifikasi = notifications.filter((i) => i.category === "VERIFIKASI").length;
  const countProker = notifications.filter((i) => i.category === "PROKER").length;
  const countLaporan = notifications.filter((i) => i.category === "LAPORAN").length;

  const headerTitle =
    role === "dinas"
      ? "Pusat Notifikasi Dinas"
      : role === "pelapor"
      ? "Pusat Notifikasi Warga"
      : "Pusat Notifikasi Pemerintahan";

  const headerDesc =
    role === "dinas"
      ? "Pantau disposisi laporan masuk, amanah program kerja, dan tindak lanjut lapangan."
      : role === "pelapor"
      ? "Pembaruan langsung status laporan Anda serta transparansi realisasi program kerja kota."
      : "Pemberitahuan verifikasi laporan publik, capaian & dokumentasi program kerja, dan disposisi dinas.";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={headerTitle} description={headerDesc}>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <CheckCheck className="size-4 text-primary" />
            Tandai Semua Sudah Dibaca
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => setSelectedFilter("ALL")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            selectedFilter === "ALL"
              ? "bg-secondary text-secondary-fg"
              : "bg-surface text-fg-muted hover:bg-surface-muted",
          )}
        >
          Semua
          <span className="rounded-full bg-secondary-fg/15 px-1.5 py-0.2 text-[10px] tabular-nums">
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("UNREAD")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            selectedFilter === "UNREAD"
              ? "bg-primary text-primary-fg"
              : "bg-surface text-fg-muted hover:bg-surface-muted",
          )}
        >
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          Belum Dibaca
          {countUnread > 0 && (
            <span className="rounded-full bg-primary-fg/20 px-1.5 py-0.2 text-[10px] tabular-nums">
              {countUnread}
            </span>
          )}
        </button>

        {countVerifikasi > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFilter("VERIFIKASI")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              selectedFilter === "VERIFIKASI"
                ? "bg-secondary text-secondary-fg"
                : "bg-surface text-fg-muted hover:bg-surface-muted",
            )}
          >
            <ShieldCheck className="size-3.5" />
            Verifikasi
            <span className="rounded-full bg-secondary-fg/15 px-1.5 py-0.2 text-[10px] tabular-nums">
              {countVerifikasi}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSelectedFilter("PROKER")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            selectedFilter === "PROKER"
              ? "bg-secondary text-secondary-fg"
              : "bg-surface text-fg-muted hover:bg-surface-muted",
          )}
        >
          <Target className="size-3.5" />
          Program Kerja
          <span className="rounded-full bg-secondary-fg/15 px-1.5 py-0.2 text-[10px] tabular-nums">
            {countProker}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("LAPORAN")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            selectedFilter === "LAPORAN"
              ? "bg-secondary text-secondary-fg"
              : "bg-surface text-fg-muted hover:bg-surface-muted",
          )}
        >
          <Inbox className="size-3.5" />
          Laporan & Isu
          <span className="rounded-full bg-secondary-fg/15 px-1.5 py-0.2 text-[10px] tabular-nums">
            {countLaporan}
          </span>
        </button>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-fg-muted">
          <Clock className="size-6 animate-spin text-primary" />
          <p className="mt-2 text-xs">Memuat daftar notifikasi...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CheckCircle2 className="size-8 text-primary" />
          <h3 className="mt-3 text-sm font-semibold text-fg">Tidak Ada Notifikasi</h3>
          <p className="mt-1 max-w-sm text-xs text-fg-muted">
            {selectedFilter === "UNREAD"
              ? "Semua notifikasi telah Anda baca. Tidak ada pemberitahuan baru yang tertunda."
              : "Belum ada riwayat aktivitas notifikasi untuk kategori ini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border bg-surface">
          {filteredNotifications.map((item) => {
            const isUnread = item.unread;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between transition-colors",
                  isUnread
                    ? "bg-primary-soft/40 dark:bg-primary-soft/10 border-l-4 border-l-amber-500"
                    : "hover:bg-surface-muted/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 relative shrink-0">
                    {item.category === "VERIFIKASI" ? (
                      <div className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-fg">
                        <ShieldCheck className="size-4" />
                      </div>
                    ) : item.category === "PROKER" ? (
                      <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-fg">
                        <Target className="size-4" />
                      </div>
                    ) : (
                      <div className="grid size-8 place-items-center rounded-md bg-surface-muted text-fg">
                        <Inbox className="size-4" />
                      </div>
                    )}
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-500 ring-2 ring-surface animate-pulse" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isUnread ? "text-fg" : "text-fg-muted",
                        )}
                      >
                        {item.title}
                      </span>
                      {isUnread ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          Baru
                        </span>
                      ) : (
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle">
                          Sudah dibaca
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-fg leading-relaxed">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-fg-subtle">
                      <span className="flex items-center gap-1 font-medium text-fg-muted">
                        <Clock className="size-3" />
                        {item.when}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 sm:shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={item.href}
                    onClick={() => markAsRead(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-3 py-1.5 text-xs font-semibold text-fg hover:border-primary hover:text-primary transition-colors"
                  >
                    Buka Halaman
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
