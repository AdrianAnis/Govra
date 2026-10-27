import { AlertCircle, ArrowLeft, ArrowRight, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
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
import { REPORTER_HOME } from "@/lib/routes";

const VISIBILITY_LABEL = { PUBLIK: "Publik", RAHASIA: "Rahasia" } as const;

export async function generateMetadata({ params }: PageProps<"/pelapor/laporan/[kode]">): Promise<Metadata> {
  const report = await getMyReport((await params).kode);
  return { title: report ? `Laporan ${report.code}` : "Laporan tidak ditemukan" };
}

export default async function MyReportPage({ params }: PageProps<"/pelapor/laporan/[kode]">) {
  const report = await getMyReport((await params).kode);
  if (!report) {
    notFound();
  }

  const locationSummary = [
    report.address_detail,
    report.location.village.name,
    report.location.district.name,
    "Kota Bandung",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Container className="flex flex-col gap-8 py-10">
      <Link
        href={REPORTER_HOME}
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
            <MapPin aria-hidden className="size-4 text-primary" />
            {locationSummary}
          </span>
          <span>Dikirim {formatDateTime(report.created_at)}</span>
        </p>
      </header>
      {report.status === "DITOLAK" && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/40 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-red-800 dark:text-red-300 font-semibold text-base sm:text-lg">
            <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>Laporan Ditolak</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
            Laporan ini tidak dapat diteruskan ke dinas terkait dan telah ditolak oleh Administrator Pusat Kota Contoh.
          </p>
          {report.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-white dark:border-red-900/40 dark:bg-zinc-900 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Alasan Penolakan:
              </span>
              <p className="text-sm font-semibold text-fg mt-1 leading-relaxed">
                {report.rejection_reason}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="flex flex-col gap-12 lg:col-span-2">
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Isi laporan</h2>
            <p className="max-w-prose whitespace-pre-line text-base leading-relaxed">{report.body}</p>
          </section>

          {report.attachments.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Foto lampiran</h2>
                <span className="text-sm text-fg-muted">{report.attachments.length} foto</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.attachments.map((attachment, index) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border-strong bg-surface-muted shadow-xs transition duration-200 ease-ui hover:border-primary hover:shadow-md"
                  >
                    <Image
                      src={attachment.url}
                      alt={`Foto lampiran laporan ${index + 1}`}
                      fill
                      sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 ease-ui group-hover:scale-105"
                      unoptimized={attachment.url.startsWith("data:")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="font-medium">Foto {index + 1}</span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Lihat foto
                        <ExternalLink aria-hidden className="size-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-4 rounded-xl border border-border-strong bg-surface p-6">
            <h2 className="text-xl font-bold tracking-tight">Lokasi kejadian</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Kecamatan</p>
                <p className="text-base font-medium">{report.location.district.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Kelurahan</p>
                <p className="text-base font-medium">{report.location.village.name}</p>
              </div>
              {report.address_detail && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Nama Jalan / Patokan</p>
                  <p className="text-base font-medium">{report.address_detail}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Koordinat Titik Peta</p>
                <p className="font-mono text-sm text-fg-muted">
                  {report.location.point.lat.toFixed(6)}, {report.location.point.lng.toFixed(6)}
                </p>
              </div>
            </div>
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
            {report.attachments.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {report.attachments.map((att, i) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-md border border-border-strong bg-surface-muted"
                    >
                      <Image
                        src={att.url}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        unoptimized={att.url.startsWith("data:")}
                      />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-fg-muted">{report.attachments.length} foto terlampir.</p>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">Tidak ada foto.</p>
            )}
          </AsideCard>
        </aside>
      </div>
    </Container>
  );
}
