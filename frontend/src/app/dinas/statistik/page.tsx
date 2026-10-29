import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAgencyStats } from "@/lib/data/agency";
import { getSessionUser } from "@/lib/data/session";
import { formatIndicator, formatNumber } from "@/lib/format";
import { ISSUE_STATUS } from "@/lib/status";

export const metadata: Metadata = { title: "Statistik Kinerja Dinas" };

export default async function AgencyStatsPage() {
  const user = await getSessionUser();
  const stats = await getAgencyStats();
  const sorted = [...stats.by_status].sort((a, b) => b.count - a.count);
  const peak = Math.max(1, ...sorted.map((item) => item.count));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/dinas"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Ringkasan
        </Link>
      </div>

      <PageHeader
        title="Statistik & Kinerja Penanganan"
        description={`Metrik performa responsivitas dan kepatuhan SLA ${user?.opdName ?? "OPD Anda"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Isu Belum Selesai</span>
            <ShieldAlert className="size-5 text-amber-600" />
          </div>
          <span className="text-5xl leading-none font-bold tracking-tight tabular-nums text-fg mt-2">
            {formatNumber(stats.total_open)}
          </span>
          <span className="text-xs text-fg-muted mt-1">membutuhkan tindakan teknis</span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Kepatuhan Terhadap SLA</span>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <span className="text-5xl leading-none font-bold tracking-tight tabular-nums text-emerald-600 mt-2">
            {formatIndicator(stats.sla_compliance_percent, "PERCENT")}
          </span>
          <span className="text-xs text-fg-muted mt-1">ditangani sebelum batas waktu</span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Median Waktu Tanggapan</span>
            <Clock className="size-5 text-primary" />
          </div>
          <span className="text-5xl leading-none font-bold tracking-tight tabular-nums text-primary mt-2">
            {formatIndicator(stats.median_response_hours, "HOURS")}
          </span>
          <span className="text-xs text-fg-muted mt-1">sejak laporan diteruskan</span>
        </div>
      </div>

      <section aria-labelledby="per-status" className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 id="per-status" className="text-lg font-bold tracking-tight text-fg">
            Distribusi Isu Berdasarkan Status
          </h2>
          <BarChart3 className="size-5 text-fg-muted" />
        </div>
        <ul className="flex flex-col gap-4">
          {sorted.map((item) => (
            <li key={item.status} className="grid items-center gap-3 sm:grid-cols-[11rem_1fr_4rem]">
              <span className="text-sm font-medium text-fg">{ISSUE_STATUS[item.status].label}</span>
              <span aria-hidden className="h-3.5 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(item.count / peak) * 100}%` }}
                />
              </span>
              <span className="text-sm font-bold tabular-nums text-fg sm:text-right">
                {formatNumber(item.count)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
