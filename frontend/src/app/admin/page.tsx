import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getAdminOverview } from "@/lib/data/admin";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Ringkasan" };

interface Tile {
  label: string;
  value: number;
  href?: string;
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const tiles: Tile[] = [
    { label: "Menunggu verifikasi", value: overview.pending_verification, href: "/admin/verifikasi?jenis=VERIFIKASI" },
    { label: "Permintaan pengalihan", value: overview.pending_transfer, href: "/admin/verifikasi?jenis=PENGALIHAN" },
    { label: "Laporan masuk hari ini", value: overview.reports_today, href: "/admin/moderasi" },
    { label: "Akun Dinas aktif", value: overview.active_agency_users, href: "/admin/pengguna" },
    { label: "Tugas latar gagal", value: overview.dead_letter_jobs },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Ringkasan" description="Yang perlu ditindaklanjuti hari ini." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const body = (
            <>
              <span className="text-sm font-semibold text-fg-muted">{tile.label}</span>
              <span className="text-5xl leading-none font-bold tracking-tight tabular-nums">
                {formatNumber(tile.value)}
              </span>
            </>
          );
          return (
            <li key={tile.label}>
              {tile.href ? (
                <Link
                  href={tile.href}
                  className="flex h-full flex-col gap-3 rounded-lg border bg-surface p-6 transition-colors duration-200 ease-ui hover:bg-surface-muted"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-3 rounded-lg border bg-surface p-6">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
