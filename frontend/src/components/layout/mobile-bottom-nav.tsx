"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Target,
  User,
  UserPlus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Notification } from "@/lib/data/notifications";
import type { SessionUser } from "@/lib/data/session";
import { useNotifications } from "@/lib/notifications-context";
import { PROFILE, REPORTER_HOME, REPORT_NEW } from "@/lib/routes";
import { ROLE_HOME } from "@/lib/session";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  user: SessionUser | null;
  notifications?: readonly Notification[];
}

export function MobileBottomNav({ user, notifications = [] }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const homeHref = user ? ROLE_HOME[user.role] : "/";
  const isHomeActive = pathname === "/" || (user && pathname === homeHref);
  const isProkerActive = pathname.startsWith("/proker");
  const isLaporActive = pathname.startsWith("/pelapor/lapor");
  const isIsuActive = pathname.startsWith("/isu");
  const isMenuActive =
    open ||
    pathname.startsWith("/rapor") ||
    pathname.startsWith("/asisten") ||
    pathname.startsWith("/masuk") ||
    pathname.startsWith("/daftar") ||
    (pathname.startsWith("/pelapor") && !isLaporActive);

  const notificationsCtx = useNotifications();
  const unreadCount = notificationsCtx?.unreadCount ?? notifications.filter((n) => n.unread).length;

  return (
    <nav
      aria-label="Navigasi bawah mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-16 items-center justify-around px-2">
        <Link
          href={homeHref}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            isHomeActive ? "text-primary font-bold" : "text-muted-foreground font-medium",
          )}
        >
          <Home className="size-5" />
          <span className="text-[10px] leading-none">Beranda</span>
        </Link>

        <Link
          href="/proker"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            isProkerActive ? "text-primary font-bold" : "text-muted-foreground font-medium",
          )}
        >
          <Target className="size-5" />
          <span className="text-[10px] leading-none">Proker</span>
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <Link
            href={REPORT_NEW}
            className="group relative -top-3.5 flex flex-col items-center justify-center active:scale-95 transition-transform"
            aria-label="Buat Laporan Aduan"
          >
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full shadow-md transition-all duration-150",
                isLaporActive
                  ? "bg-secondary text-secondary-fg ring-4 ring-primary/20 scale-105"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <Plus className="size-6 stroke-[2.5]" />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold mt-0.5",
                isLaporActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              Lapor
            </span>
          </Link>
        </div>

        <Link
          href="/isu"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95",
            isIsuActive ? "text-primary font-bold" : "text-muted-foreground font-medium",
          )}
        >
          <MessageSquareText className="size-5" />
          <span className="text-[10px] leading-none">Isu Warga</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer",
                  isMenuActive ? "text-primary font-bold" : "text-muted-foreground font-medium",
                )}
              />
            }
          >
            <div className="relative">
              {user ? <User className="size-5" /> : <Menu className="size-5" />}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-1 flex size-2 rounded-full bg-destructive" />
              )}
            </div>
            <span className="text-[10px] leading-none">{user ? "Akun" : "Menu"}</span>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 shrink-0" />
            
            <SheetHeader className="px-5 pt-3 pb-3 border-b border-border text-left">
              <SheetTitle className="text-base font-bold text-foreground">
                {user ? "Akun & Layanan" : "Menu & Layanan Govra"}
              </SheetTitle>
              {user ? (
                <div className="flex items-center gap-3 pt-2">
                  <span className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-fg shrink-0">
                    {user.initials}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Satu platform transparansi dan pengaduan untuk warga dan pemerintah.
                </p>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {!user && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/masuk"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <LogIn className="size-4" />
                    <span>Masuk</span>
                  </Link>
                  <Link
                    href="/daftar"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all active:scale-95"
                  >
                    <UserPlus className="size-4" />
                    <span>Daftar Akun</span>
                  </Link>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground px-2 uppercase tracking-wider">
                  Navigasi Utama
                </span>

                {user && user.role === "pelapor" && (
                  <Link
                    href={REPORTER_HOME}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    <FileText className="size-4.5 text-primary" />
                    <span>Laporan Saya</span>
                  </Link>
                )}

                {user && (
                  <Link
                    href={user.role === "pelapor" ? PROFILE : ROLE_HOME[user.role]}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    <User className="size-4.5 text-primary" />
                    <span>{user.role === "pelapor" ? "Profil Pengguna" : "Buka Panel Kerja"}</span>
                  </Link>
                )}

                {user && user.role === "pelapor" && (
                  <Link
                    href="/pelapor/notifikasi"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="size-4.5 text-primary" />
                      <span>Notifikasi</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {unreadCount} baru
                      </span>
                    )}
                  </Link>
                )}

                <Link
                  href="/rapor"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] transition-all"
                >
                  <BarChart3 className="size-4.5 text-primary" />
                  <span>Rapor Kinerja OPD</span>
                </Link>
              </div>

              <div className="flex flex-col space-y-1 border-t border-border pt-3">
                <span className="text-[11px] font-semibold text-muted-foreground px-2 uppercase tracking-wider">
                  Informasi & Bantuan
                </span>

                <Link
                  href="/metodologi"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <BookOpen className="size-4" />
                  <span>Metodologi Penilaian</span>
                </Link>

                <Link
                  href="/privasi"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ShieldCheck className="size-4" />
                  <span>Kebijakan Privasi</span>
                </Link>
              </div>

              {user && (
                <div className="border-t border-border pt-2 pb-1">
                  <a
                    href="/api/auth/keluar"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-4.5" />
                    <span>Keluar dari Akun</span>
                  </a>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
