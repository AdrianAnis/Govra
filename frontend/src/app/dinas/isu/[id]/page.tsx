import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionPanel } from "@/components/agency/action-panel";
import { PhotoControls } from "@/components/agency/photo-controls";
import { SpreadMap } from "@/components/agency/spread-map";
import { AsideCard } from "@/components/aside-card";
import { IssueTimeline } from "@/components/issue-timeline";
import { IssueStatusBadge } from "@/components/status-badge";
import { UrgencyMarker } from "@/components/urgency-marker";
import { slaInfo } from "@/lib/agency-format";
import { currentTime } from "@/lib/clock";
import { getAgencyIssue } from "@/lib/data/agency";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Schema } from "@/lib/schema";

const SAFETY_LABEL: Record<Schema<"SafetyRisk">, string> = {
  NONE: "Tidak ada risiko keselamatan",
  PROPERTY: "Berisiko pada harta benda",
  LIFE: "Berisiko pada keselamatan jiwa",
};

export async function generateMetadata({ params }: PageProps<"/dinas/isu/[id]">): Promise<Metadata> {
  const issue = await getAgencyIssue((await params).id);
  return { title: issue ? issue.title : "Isu tidak ditemukan" };
}

export default async function AgencyIssuePage({ params }: PageProps<"/dinas/isu/[id]">) {
  const { id } = await params;
  const issue = await getAgencyIssue(id);
  if (!issue) {
    notFound();
  }
  const now = currentTime();
  const sla = slaInfo(issue.sla_due_at, now);
  const points = issue.reports.map((report) => report.location.point);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/dinas/laporan"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Daftar seluruh laporan
      </Link>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <IssueStatusBadge status={issue.status} />
          <UrgencyMarker urgency={issue.urgency} />
          <span className="text-sm text-fg-muted">{issue.category.name}</span>
        </div>
        <h1 className="max-w-4xl text-4xl leading-tight font-bold tracking-tight">{issue.title}</h1>
        <p className="text-fg-muted">
          {issue.location.village.name}, {issue.location.district.name} · {formatNumber(issue.reporter_count)} pelapor ·{" "}
          <span className={sla.overdue ? "font-semibold text-fg" : undefined}>{sla.text}</span>
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <section aria-labelledby="ringkasan" className="flex flex-col gap-3 rounded-lg bg-surface-muted p-6">
            <h2 id="ringkasan" className="text-sm font-semibold text-fg-muted">
              Ringkasan AI
            </h2>
            <p className="text-lg leading-snug font-semibold">{issue.ai.summary}</p>
            <p className="text-sm text-fg-muted">
              {SAFETY_LABEL[issue.ai.safety_risk]} · keyakinan {Math.round(issue.ai.confidence * 100)}%
              {issue.ai.sensitive ? " · memuat data sensitif" : ""}
            </p>
          </section>

          <section aria-labelledby="laporan" className="flex flex-col gap-6">
            <h2 id="laporan" className="text-2xl font-bold tracking-tight">
              Laporan warga
            </h2>
            <p className="text-sm text-fg-muted">
              Identitas pelapor tidak ditampilkan. Pilih foto yang layak tampil di publik dan satu foto sebagai sampul
              isu.
            </p>
            <ul className="flex flex-col gap-6">
              {issue.reports.map((report, reportIndex) => (
                <li key={report.code} className="flex flex-col gap-5 rounded-lg border bg-surface p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{report.code}</h3>
                    <p className="text-sm text-fg-muted">
                      {report.visibility === "RAHASIA" ? "Rahasia" : "Publik"} · {formatDateTime(report.created_at)}
                    </p>
                  </div>
                  <p className="max-w-prose">{report.body}</p>
                  {report.attachments.length > 0 && (
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {report.attachments.map((attachment, index) => (
                        <li key={attachment.id}>
                          <PhotoControls
                            issueId={issue.id}
                            attachment={attachment}
                            index={reportIndex * 10 + index + 1}
                            locked={report.visibility === "RAHASIA"}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {issue.reporter_count > issue.reports.length && (
              <p className="text-sm text-fg-muted">
                Menampilkan {issue.reports.length} dari {formatNumber(issue.reporter_count)} laporan.
              </p>
            )}
          </section>

          <section aria-labelledby="sebaran" className="flex flex-col gap-4">
            <h2 id="sebaran" className="text-2xl font-bold tracking-tight">
              Sebaran lokasi
            </h2>
            <SpreadMap points={points} />
          </section>

          <section aria-labelledby="perkembangan" className="flex flex-col gap-8">
            <h2 id="perkembangan" className="text-2xl font-bold tracking-tight">
              Perkembangan penanganan
            </h2>
            <IssueTimeline events={issue.timeline} now={now} />
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <ActionPanel issueId={issue.id} transitions={issue.allowed_transitions} />
          <AsideCard title="Batas tanggapan">
            <p className={sla.overdue ? "font-semibold" : "text-fg-muted"}>{sla.text}</p>
          </AsideCard>
        </aside>
      </div>
    </div>
  );
}
