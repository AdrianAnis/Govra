import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { AdminDistributionMap } from "@/components/admin/admin-distribution-map";
import { PageHeader } from "@/components/page-header";
import { IssueStatusBadge } from "@/components/status-badge";
import { UrgencyMarker } from "@/components/urgency-marker";
import { Button } from "@/components/ui/button";
import { slaInfo } from "@/lib/agency-format";
import { currentTime } from "@/lib/clock";
import { listAgencyIssues } from "@/lib/data/agency";
import { getDistributionPoints } from "@/lib/data/map";
import { getSessionUser } from "@/lib/data/session";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { agencyIssueHref } from "@/lib/routes";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ringkasan Dinas" };

function calculateAiUrgencyScore(issue: Schema<"AgencyIssueSummary">): number {
  let score = 0;
  if (issue.urgency === "URGENT") score += 1000;
  else if (issue.urgency === "TINGGI") score += 500;
  else score += 100;

  score += Math.min(10, issue.reporter_count) * 60;
  if (issue.status === "DITERUSKAN") score += 200;
  if (issue.response_overdue) score += 300;
  return score;
}

export default async function AgencyDashboardPage() {
  const user = await getSessionUser();
  const now = currentTime();

  const [allIssuesResult, mapPoints] = await Promise.all([
    listAgencyIssues({ limit: 100 }, user?.opdId || undefined),
    getDistributionPoints(user?.opdId || undefined),
  ]);

  const allItems = allIssuesResult.items;

  const masukCount = allItems.filter(
    (i) => i.status === "DITERUSKAN" || i.status === "MENUNGGU_VERIFIKASI"
  ).length;

  const urgentCount = allItems.filter(
    (i) =>
      (i.urgency === "URGENT" || i.reporter_count >= 3) &&
      i.status !== "SELESAI" &&
      i.status !== "DITOLAK"
  ).length;

  const prosesCount = allItems.filter((i) => i.status === "DIPROSES").length;
  const selesaiCount = allItems.filter((i) => i.status === "SELESAI").length;

  const urgentIssues = [...allItems]
    .filter((i) => i.status !== "SELESAI" && i.status !== "DITOLAK")
    .sort((a, b) => calculateAiUrgencyScore(b) - calculateAiUrgencyScore(a))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Ringkasan Dinas"
          description={user?.opdName ?? "Panel Operasional & Penanganan Isu OPD"}
        />
        <Link href="/dinas/laporan">
          <Button variant="outline" className="gap-2">
            Lihat Semua Laporan
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
          <span className="text-base font-semibold text-fg-muted">Laporan Masuk</span>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(masukCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-border border-l-4 border-l-secondary bg-surface p-6">
          <span className="text-base font-semibold text-fg-muted">Laporan Urgent</span>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-secondary">
              {formatNumber(urgentCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
          <span className="text-base font-semibold text-fg-muted">Sedang Diproses</span>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(prosesCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-border bg-surface p-6">
          <span className="text-base font-semibold text-fg-muted">Tuntas Dikerjakan</span>
          <div className="mt-4">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(selesaiCount)}
            </span>
          </div>
        </div>
      </div>

      <AdminDistributionMap
        points={mapPoints}
        mode="dinas"
        title={`Peta Sebaran Laporan · ${user?.opdName ?? "Wilayah Dinas"}`}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-fg">
              Laporan Urgent
            </h2>
            <p className="text-sm text-fg-muted mt-1">
              Disortir otomatis berdasarkan frekuensi pelapor, dukungan isu, dan batas waktu SLA.
            </p>
          </div>
          <Link href="/dinas/laporan" className="text-sm font-semibold text-primary hover:underline">
            Lihat Semua ({allIssuesResult.total})
          </Link>
        </div>

        {urgentIssues.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-sm font-semibold uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Isu & Lokasi</th>
                    <th scope="col" className="px-4 py-3">Urgensi</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-center">Pelapor</th>
                    <th scope="col" className="px-4 py-3">Batas SLA</th>
                    <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {urgentIssues.map((issue) => {
                    const sla = slaInfo(issue.sla_due_at, now);
                    return (
                      <tr
                        key={issue.id}
                        className="transition-colors hover:bg-surface-muted/50"
                      >
                        <td className="px-4 py-3.5 sm:px-6">
                          <Link
                            href={agencyIssueHref(issue.id)}
                            className="group flex flex-col gap-1"
                          >
                            <span className="text-base font-semibold text-fg group-hover:text-primary transition-colors">
                              {issue.title}
                            </span>
                            <span className="text-sm text-fg-muted">
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
                          <span className="inline-flex items-center gap-1.5 text-base font-semibold tabular-nums text-fg">
                            <Users className="size-4 text-fg-muted" />
                            {formatNumber(issue.reporter_count)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "text-sm tabular-nums",
                              sla.overdue ? "font-semibold text-fg" : "text-fg-muted"
                            )}
                          >
                            {sla.text}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <Link href={agencyIssueHref(issue.id)}>
                            <Button size="sm" variant={issue.status === "DITERUSKAN" ? "primary" : "outline"}>
                              {issue.status === "DITERUSKAN" ? "Mulai Proses" : "Detail"}
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center bg-surface">
            <p className="text-base font-semibold text-fg">Tidak ada laporan urgent saat ini</p>
            <p className="text-sm text-fg-muted mt-1">
              Seluruh laporan telah ditindaklanjuti atau sesuai jadwal penanganan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
