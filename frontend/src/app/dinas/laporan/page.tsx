import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Filter, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { IssueStatusBadge } from "@/components/status-badge";
import { UrgencyMarker } from "@/components/urgency-marker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state-message";
import { slaInfo } from "@/lib/agency-format";
import { currentTime } from "@/lib/clock";
import { listAgencyIssues } from "@/lib/data/agency";
import { getSessionUser } from "@/lib/data/session";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { agencyIssueHref } from "@/lib/routes";
import { parseIssueFilters, type RawSearchParams } from "@/lib/search-params";
import { ISSUE_STATUS } from "@/lib/status";
import { activeParams } from "@/lib/url";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Semua Laporan Dinas" };

const PAGE_SIZE = 15;

const STATUS_TABS = [
  { key: "semua", label: "Semua Laporan", status: undefined },
  { key: "masuk", label: "Laporan Masuk", status: "DITERUSKAN" as const },
  { key: "proses", label: "Sedang Diproses", status: "DIPROSES" as const },
  { key: "selesai", label: "Selesai", status: "SELESAI" as const },
  { key: "lainnya", label: "Ditolak / Dialihkan", status: "DITOLAK" as const },
] as const;

export default async function AgencyAllReportsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const filters = parseIssueFilters(resolvedParams);
  const user = await getSessionUser();
  const now = currentTime();

  const tabParam = typeof resolvedParams.tab === "string" ? resolvedParams.tab : "semua";
  const activeTab = STATUS_TABS.find((t) => t.key === tabParam) ?? STATUS_TABS[0];

  const targetStatus = activeTab.status ?? filters.status;

  const issues = await listAgencyIssues(
    {
      status: targetStatus,
      urgency: filters.urgency,
      page: filters.page,
      limit: PAGE_SIZE,
    },
    user?.opdId || undefined
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
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
        title="Daftar Seluruh Laporan"
        description={`Semua laporan masyarakat yang ditujukan kepada ${user?.opdName ?? "OPD Anda"}.`}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          return (
            <Link
              key={tab.key}
              href={`/dinas/laporan?${new URLSearchParams(
                activeParams({ tab: tab.key, urgency: filters.urgency })
              ).toString()}`}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          Menampilkan <span className="font-semibold text-fg tabular-nums">{issues.items.length}</span> dari{" "}
          <span className="font-semibold text-fg tabular-nums">{issues.total}</span> total laporan.
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={`/dinas/laporan?${new URLSearchParams(
              activeParams({ tab: activeTab.key })
            ).toString()}`}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              !filters.urgency
                ? "border-primary bg-primary-soft text-primary font-bold"
                : "border-border text-fg-muted hover:bg-surface-muted"
            )}
          >
            Semua Urgensi
          </Link>
          <Link
            href={`/dinas/laporan?${new URLSearchParams(
              activeParams({ tab: activeTab.key, urgency: "URGENT" })
            ).toString()}`}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium",
              filters.urgency === "URGENT"
                ? "border-red-500 bg-red-50 text-red-700 font-bold"
                : "border-border text-fg-muted hover:bg-surface-muted"
            )}
          >
            Urgent Saja
          </Link>
        </div>
      </div>

      {issues.items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">Laporan & Lokasi</th>
                  <th scope="col" className="px-4 py-3">Urgensi</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-center">Pelapor</th>
                  <th scope="col" className="px-4 py-3">Batas Penanganan</th>
                  <th scope="col" className="px-4 py-3">Pembaruan</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issues.items.map((issue) => {
                  const sla = slaInfo(issue.sla_due_at, now);
                  return (
                    <tr key={issue.id} className="transition-colors hover:bg-surface-muted/60">
                      <td className="px-4 py-3.5 sm:px-6">
                        <Link href={agencyIssueHref(issue.id)} className="group flex flex-col gap-0.5">
                          <span className="font-semibold text-fg group-hover:text-primary transition-colors">
                            {issue.title}
                          </span>
                          <span className="text-xs text-fg-muted">
                            {issue.location.village.name}, {issue.location.district.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <UrgencyMarker urgency={issue.urgency} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <IssueStatusBadge status={issue.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-fg">
                          <Users className="size-3.5 text-fg-muted" />
                          {formatNumber(issue.reporter_count)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            sla.overdue ? "font-bold text-red-600" : "text-fg-muted"
                          )}
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-fg-muted tabular-nums">
                        {formatRelativeTime(issue.updated_at, now)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <Link href={agencyIssueHref(issue.id)}>
                          <Button size="sm" variant={issue.status === "DITERUSKAN" ? "primary" : "outline"}>
                            {issue.status === "DITERUSKAN" ? "Proses Isu" : "Lihat Detail"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Tidak ada laporan"
          description="Tidak ditemukan laporan yang sesuai dengan filter yang Anda tentukan."
        />
      )}

      <Pagination
        page={issues.page}
        limit={issues.limit}
        total={issues.total}
        basePath="/dinas/laporan"
        params={activeParams({
          tab: activeTab.key,
          urgency: filters.urgency,
        })}
      />
    </div>
  );
}
