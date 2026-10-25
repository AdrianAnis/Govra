import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getAgencyStats } from "@/lib/data/agency";
import { formatIndicator, formatNumber } from "@/lib/format";
import { ISSUE_STATUS } from "@/lib/status";

export const metadata: Metadata = { title: "Statistik" };

export default async function AgencyStatsPage() {
  const stats = await getAgencyStats();
  const sorted = [...stats.by_status].sort((a, b) => b.count - a.count);
  const peak = Math.max(1, ...sorted.map((item) => item.count));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Statistik" description="Ringkasan penanganan isu di OPD Anda." />

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border bg-surface p-6">
          <dt className="text-sm font-semibold text-fg-muted">Isu belum selesai</dt>
          <dd className="text-5xl leading-none font-bold tracking-tight tabular-nums">
            {formatNumber(stats.total_open)}
          </dd>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-surface p-6">
          <dt className="text-sm font-semibold text-fg-muted">Tanggapan sesuai SLA</dt>
          <dd className="text-5xl leading-none font-bold tracking-tight tabular-nums">
            {formatIndicator(stats.sla_compliance_percent, "PERCENT")}
          </dd>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-surface p-6">
          <dt className="text-sm font-semibold text-fg-muted">Median waktu tanggapan</dt>
          <dd className="text-5xl leading-none font-bold tracking-tight tabular-nums">
            {formatIndicator(stats.median_response_hours, "HOURS")}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="per-status" className="flex flex-col gap-5 rounded-lg border bg-surface p-6">
        <h2 id="per-status" className="text-xl font-bold tracking-tight">
          Isu per status
        </h2>
        <ul className="flex flex-col gap-4">
          {sorted.map((item) => (
            <li key={item.status} className="grid items-center gap-3 sm:grid-cols-[10rem_1fr_3rem]">
              <span className="text-sm font-medium">{ISSUE_STATUS[item.status].label}</span>
              <span aria-hidden className="h-4 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-secondary"
                  style={{ width: `${(item.count / peak) * 100}%` }}
                />
              </span>
              <span className="text-sm font-semibold tabular-nums sm:text-right">{formatNumber(item.count)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
