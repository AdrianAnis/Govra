import type { Metadata } from "next";
import Link from "next/link";
import { AdminDistributionMap } from "@/components/admin/admin-distribution-map";
import { StatCard, StatGrid } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import {
  getPemerintahOverview,
  getPemerintahUrgentIssues,
} from "@/lib/data/pemerintah";
import { getDistributionPoints } from "@/lib/data/map";
import { formatNumber, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Ringkasan Eksekutif" };

interface StatTile {
  label: string;
  value: string | number;
  sublabel?: string;
  href?: string;
}

export default async function PemerintahOverviewPage() {
  const [overview, urgentIssues, mapPoints] = await Promise.all([
    getPemerintahOverview(),
    getPemerintahUrgentIssues(),
    getDistributionPoints(),
  ]);

  const tiles: StatTile[] = [
    {
      label: "Total Laporan Masuk",
      value: formatNumber(overview.totalReports),
      sublabel: `${overview.inProgressReports} laporan dalam proses`,
      href: "/pemerintah/laporan",
    },
    {
      label: "Isu Mendesak Kota",
      value: formatNumber(overview.urgentIssuesCount),
      sublabel: "Memerlukan perhatian kepala daerah",
      href: "/pemerintah/laporan",
    },
    {
      label: "Tingkat Penyelesaian",
      value: `${overview.completionRate}%`,
      sublabel: `${overview.resolvedReports} dari ${overview.totalReports} selesai`,
      href: "/pemerintah/kinerja-opd",
    },
    {
      label: "Realisasi Anggaran Proker",
      value: `${overview.budgetRealizationRate}%`,
      sublabel: `${formatRupiah(overview.totalBudgetRealization)} dari ${formatRupiah(overview.totalBudgetPagu)}`,
      href: "/pemerintah/proker",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ringkasan Eksekutif"
        description="Pantauan komprehensif aduan warga, efektivitas penanganan OPD, dan capaian program kerja daerah."
      />

      <StatGrid>
        {tiles.map((tile) => (
          <StatCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            {...(tile.sublabel ? { hint: tile.sublabel } : {})}
            {...(tile.href ? { href: tile.href } : {})}
          />
        ))}
      </StatGrid>

      <AdminDistributionMap
        points={mapPoints}
        mode="admin"
        title="Peta Sebaran Laporan Seluruh Wilayah Kota"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border bg-surface p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Isu Mendesak & Prioritas</h2>
              <p className="text-xs text-fg-muted">
                Aduan masyarakat dengan dampak tinggi yang memerlukan atensi dinas terkait.
              </p>
            </div>
            <Link
              href="/pemerintah/laporan"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {urgentIssues.length === 0 ? (
            <div className="py-8 text-center text-sm text-fg-muted">
              Tidak ada isu mendesak aktif saat ini.
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {urgentIssues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-fg line-clamp-1">
                      {issue.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      {issue.urgency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <span>{issue.opdName}</span>
                    <span className="tabular-nums font-medium">
                      {issue.reportersCount} pelapor
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-lg border bg-surface p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Status Program Kerja</h2>
              <p className="text-xs text-fg-muted">
                Monitoring pelaksanaan program strategis pemerintah daerah.
              </p>
            </div>
            <Link
              href="/pemerintah/proker"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Detail Proker
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="flex flex-col items-center justify-center rounded-md border bg-surface-muted p-3 text-center">
              <span className="text-xs text-fg-muted">Sesuai Jadwal</span>
              <span className="text-2xl font-bold tabular-nums text-emerald-600">
                {overview.programsSummary.onSchedule}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md border bg-surface-muted p-3 text-center">
              <span className="text-xs text-fg-muted">Terlambat</span>
              <span className="text-2xl font-bold tabular-nums text-red-600">
                {overview.programsSummary.delayed}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-md border bg-surface-muted p-3 text-center">
              <span className="text-xs text-fg-muted">Selesai</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {overview.programsSummary.completed}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Penyerapan Anggaran Daerah</span>
              <span className="tabular-nums">{overview.budgetRealizationRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, overview.budgetRealizationRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-fg-muted">
              <span>Realisasi: {formatRupiah(overview.totalBudgetRealization)}</span>
              <span>Pagu: {formatRupiah(overview.totalBudgetPagu)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
