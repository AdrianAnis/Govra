import {
  ChartColumn,
  Database,
  Flag,
  Inbox,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
}

export interface PanelNavItem extends NavLink {
  icon: LucideIcon;
  exact?: boolean;
}

export const MAIN_NAV: readonly NavLink[] = [
  { href: "/proker", label: "Proker" },
  { href: "/rapor", label: "Rapor" },
  { href: "/isu", label: "Isu" },
];

export const FOOTER_NAV: readonly NavLink[] = [
  { href: "/metodologi", label: "Metodologi" },
  { href: "/privasi", label: "Kebijakan Privasi" },
  { href: "/proker", label: "Proker" },
  { href: "/rapor", label: "Rapor" },
];

export const PANEL_SECTIONS = {
  dinas: {
    title: "Govra · Dinas",
    items: [
      { href: "/dinas", label: "Inbox Isu", icon: Inbox, exact: true },
      { href: "/dinas/statistik", label: "Statistik", icon: ChartColumn },
    ],
  },
  admin: {
    title: "Govra · Admin",
    items: [
      { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
      { href: "/admin/pengguna", label: "Pengguna", icon: Users },
      { href: "/admin/master", label: "Master Data", icon: Database },
      { href: "/admin/moderasi", label: "Moderasi", icon: Flag },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
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
