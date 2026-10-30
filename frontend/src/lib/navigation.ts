import {
  Bell,
  Building2,
  Inbox,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { REPORT_DETAIL_PREFIX, REPORTER_HOME, REPORT_NEW } from "@/lib/routes";

export interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  alsoActive?: readonly string[];
}

export interface PanelNavItem extends NavLink {
  icon: LucideIcon;
}

export const MAIN_NAV: readonly NavLink[] = [
  { href: "/proker", label: "Proker" },
  { href: "/rapor", label: "Rapor" },
  { href: "/isu", label: "Isu Terkini" },
];

export const MEMBER_NAV: readonly NavLink[] = [
  { href: REPORTER_HOME, label: "Laporan saya", exact: true, alsoActive: [REPORT_DETAIL_PREFIX] },
  ...MAIN_NAV,
];

export interface FooterGroup {
  title: string;
  links: readonly NavLink[];
}

export const FOOTER_GROUPS: readonly FooterGroup[] = [
  {
    title: "Jelajahi",
    links: [
      { href: "/proker", label: "Program kerja" },
      { href: "/rapor", label: "Rapor OPD" },
      { href: "/isu", label: "Isu Terkini" },
    ],
  },
  {
    title: "Warga",
    links: [
      { href: REPORT_NEW, label: "Buat laporan" },
      { href: REPORTER_HOME, label: "Laporan saya" },
      { href: "/masuk", label: "Masuk" },
      { href: "/daftar", label: "Daftar" },
    ],
  },
  {
    title: "Transparansi",
    links: [
      { href: "/metodologi", label: "Metodologi" },
      { href: "/privasi", label: "Kebijakan privasi" },
    ],
  },
];

export const PANEL_SECTIONS = {
  pemerintah: {
    title: "Govra · Admin Pusat",
    items: [
      { href: "/pemerintah", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/pemerintah/proker", label: "Program Kerja", icon: Target },
      { href: "/pemerintah/laporan", label: "Semua Laporan", icon: Inbox },
      { href: "/pemerintah/kinerja-opd", label: "Kinerja OPD", icon: Building2 },
      { href: "/admin/pengguna", label: "Akun Dinas", icon: Users },
      { href: "/pemerintah/notifikasi", label: "Notifikasi", icon: Bell },
    ],
  },
  dinas: {
    title: "Govra · Dinas",
    items: [
      { href: "/dinas", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/dinas/tugas-proker", label: "Tugas Proker", icon: Target },
      { href: "/dinas/laporan", label: "Semua Laporan", icon: Inbox },
      { href: "/dinas/notifikasi", label: "Notifikasi", icon: Bell },
    ],
  },
  admin: {
    title: "Govra · Admin Pusat",
    items: [
      { href: "/pemerintah", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/pemerintah/proker", label: "Program Kerja", icon: Target },
      { href: "/pemerintah/laporan", label: "Semua Laporan", icon: Inbox },
      { href: "/pemerintah/kinerja-opd", label: "Kinerja OPD", icon: Building2 },
      { href: "/admin/pengguna", label: "Akun Dinas", icon: Users },
      { href: "/pemerintah/notifikasi", label: "Notifikasi", icon: Bell },
    ],
  },
} satisfies Record<string, { title: string; items: readonly PanelNavItem[] }>;

export type PanelSection = keyof typeof PANEL_SECTIONS;

export function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) {
    return true;
  }
  return !exact && pathname.startsWith(`${href}/`);
}
