import {
  Inbox,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
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
  dinas: {
    title: "Govra · Dinas",
    items: [
      { href: "/dinas", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/dinas/laporan", label: "Semua Laporan", icon: Inbox },
    ],
  },
  admin: {
    title: "Govra · Admin",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/admin/pengguna", label: "Pengguna", icon: Users },
      { href: "/admin/audit", label: "Audit", icon: ScrollText },
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
