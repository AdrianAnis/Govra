import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsideCard } from "@/components/aside-card";
import { IssueTimeline } from "@/components/issue-timeline";
import { Container } from "@/components/layout/container";
import { ResolutionFeedback } from "@/components/report/resolution-feedback";
import { IssueStatusBadge } from "@/components/status-badge";
import { currentTime } from "@/lib/clock";
import { getMyReport } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/format";

const VISIBILITY_LABEL = { PUBLIK: "Publik", RAHASIA: "Rahasia" } as const;

export async function generateMetadata({ params }: PageProps<"/laporan-saya/[kode]">): Promise<Metadata> {
  const report = await getMyReport((await params).kode);
  return { title: report ? `Laporan ${report.code}` : "Laporan tidak ditemukan" };
}

export default async function MyReportPage({ params }: PageProps<"/laporan-saya/[kode]">) {
  const report = await getMyReport((await params).kode);
  if (!report) {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-8 py-10">
      <Link
        href="/laporan-saya"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Laporan saya
      </Link>
      <header className="flex flex-col gap-4 border-b pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-fg-muted tabular-nums">{report.code}</span>
          <IssueStatusBadge status={report.status} />
          <span className="text-sm text-fg-muted">{VISIBILITY_LABEL[report.visibility]}</span>
        </div>
        <h1 className="text-3xl leading-tight font-bold tracking-tighter lg:text-5xl">
          {report.title ?? "Laporan tanpa judul"}
        </h1>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-1 text-fg-muted">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            {report.location.village.name}, {report.location.district.name}
          </span>
          <span>Dikirim {formatDateTime(report.created_at)}</span>
        </p>
      </header>
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="flex flex-col gap-12 lg:col-span-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Isi laporan</h2>
            <p className="max-w-prose whitespace-pre-line">{report.body}</p>
          </section>
          <section className="flex flex-col gap-8">
            <h2 className="text-2xl font-bold tracking-tight">Perkembangan penanganan</h2>
            <IssueTimeline events={report.timeline} now={currentTime()} />
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <ResolutionFeedback code={report.code} feedback={report.feedback} />
          {report.issue && report.visibility === "PUBLIK" && (
            <Link
              href={`/isu/${report.issue.id}`}
              className="group flex items-center justify-between gap-4 rounded-lg bg-surface-muted p-6 transition-colors duration-200 ease-ui hover:bg-primary-soft"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-fg-muted">Isu terkait</span>
                <span className="text-lg font-semibold">{report.issue.title}</span>
              </span>
              <ArrowRight
                aria-hidden
                className="size-5 shrink-0 text-primary transition-transform duration-200 ease-ui group-hover:translate-x-1"
              />
            </Link>
          )}
          <AsideCard title="Foto lampiran">
            <p className="text-fg-muted">
              {report.attachments.length > 0 ? `${report.attachments.length} foto terlampir.` : "Tidak ada foto."}
            </p>
          </AsideCard>
        </aside>
      </div>
    </Container>
  );
}
