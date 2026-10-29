import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  Sparkles,
  Users,
} from "lucide-react";
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
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Laporan Masuk</span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-primary">
              <Inbox className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(masukCount)}
            </span>
            <span className="text-xs text-fg-muted">menunggu respons</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-amber-300 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-900">Laporan Urgent (AI)</span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
              <Flame className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-amber-950">
              {formatNumber(urgentCount)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
              <Sparkles className="size-3" />
              Prioritas AI
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Sedang Diproses</span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(prosesCount)}
            </span>
            <span className="text-xs text-fg-muted">dalam pengerjaan</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Tuntas Dikerjakan</span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(selesaiCount)}
            </span>
            <span className="text-xs text-emerald-700 font-medium">berhasil diselesaikan</span>
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-fg">
                Laporan Urgent & Prioritas Penanganan AI
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                <Sparkles className="size-3" />
                AI Auto-Sorted
              </span>
            </div>
            <p className="text-sm text-fg-muted">
              Dianalisis dan disortir otomatis berdasarkan frekuensi pelapor, lonjakan dukungan isu, dan batas waktu SLA.
            </p>
          </div>
          <Link href="/dinas/laporan" className="text-sm font-semibold text-primary hover:underline">
            Buka Semua ({allIssuesResult.total})
          </Link>
        </div>

        {urgentIssues.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Isu & Lokasi</th>
                    <th scope="col" className="px-4 py-3">Urgensi AI</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-center">Dukungan / Pelapor</th>
                    <th scope="col" className="px-4 py-3">Batas SLA</th>
                    <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {urgentIssues.map((issue) => {
                    const sla = slaInfo(issue.sla_due_at, now);
                    const isHighImpact = issue.reporter_count >= 3 || issue.urgency === "URGENT";
                    return (
                      <tr
                        key={issue.id}
                        className={cn(
                          "transition-colors hover:bg-surface-muted/60",
                          isHighImpact && "bg-amber-50/20"
                        )}
                      >
                        <td className="px-4 py-3.5 sm:px-6">
                          <Link
                            href={agencyIssueHref(issue.id)}
                            className="group flex flex-col gap-0.5"
                          >
                            <span className="font-semibold text-fg group-hover:text-primary transition-colors">
                              {issue.title}
                            </span>
                            <span className="text-xs text-fg-muted">
                              {issue.location.village.name}, {issue.location.district.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <UrgencyMarker urgency={issue.urgency} />
                            {issue.reporter_count >= 3 && (
                              <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                Viral
                              </span>
                            )}
                          </div>
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-surface">
            <CheckCircle2 className="size-10 text-emerald-600 mb-2" />
            <p className="font-semibold text-fg">Tidak ada laporan urgent saat ini</p>
            <p className="text-sm text-fg-muted mt-1">
              Seluruh laporan telah ditindaklanjuti atau sesuai jadwal penanganan.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
