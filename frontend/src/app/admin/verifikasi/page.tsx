import type { Metadata } from "next";
import Link from "next/link";
import { VerificationItem } from "@/components/admin/verification-item";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { listOpdsAdmin, listVerification } from "@/lib/data/admin";
import { currentTime } from "@/lib/clock";
import { parsePage, type RawSearchParams } from "@/lib/search-params";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verifikasi & Klasifikasi Topik" };

const PAGE_SIZE = 20;

const TOPIC_TABS: ReadonlyArray<{ code: string | null; label: string }> = [
  { code: null, label: "Semua Topik" },
  { code: "DBM-SDA", label: "Jalan & Infrastruktur" },
  { code: "DLHK", label: "Kebersihan & Sampah" },
  { code: "DISHUB", label: "Lalu Lintas & Dishub" },
  { code: "SATPOL-PP", label: "Ketertiban Umum" },
  { code: "DINKES", label: "Kesehatan" },
  { code: "BPBD", label: "Kebencanaan" },
];

const QUEUE_TABS: ReadonlyArray<{ kind: Schema<"VerificationKind"> | null; label: string }> = [
  { kind: null, label: "Semua Status" },
  { kind: "VERIFIKASI", label: "Perlu Verifikasi" },
  { kind: "PENGALIHAN", label: "Pengalihan Dinas" },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseKind(value: string | undefined): Schema<"VerificationKind"> | undefined {
  return value === "VERIFIKASI" || value === "PENGALIHAN" ? value : undefined;
}

export default async function AdminVerificationPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const kind = parseKind(first(raw.jenis));
  const topicCode = first(raw.topik) || null;

  const [queue, opds] = await Promise.all([
    listVerification({
      kind,
      opdCode: topicCode ?? undefined,
      page: parsePage(raw),
      limit: PAGE_SIZE,
    }),
    listOpdsAdmin(),
  ]);
  const now = currentTime();

  const buildUrl = (newKind?: Schema<"VerificationKind"> | null, newTopic?: string | null) => {
    const params = new URLSearchParams();
    const targetKind = newKind !== undefined ? newKind : kind;
    const targetTopic = newTopic !== undefined ? newTopic : topicCode;

    if (targetKind) params.set("jenis", targetKind);
    if (targetTopic) params.set("topik", targetTopic);

    const qs = params.toString();
    return qs ? `/admin/verifikasi?${qs}` : "/admin/verifikasi";
  };

  const paginationParams: Record<string, string> = {};
  if (kind) paginationParams.jenis = kind;
  if (topicCode) paginationParams.topik = topicCode;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Verifikasi & Klasifikasi Topik"
        description="Hasil klasifikasi AI Gemini berdasarkan topik masalah dan kedekatan wilayah laporan warga."
      />

      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Pilih Topik Laporan
        </span>
        <nav aria-label="Topik laporan" className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          {TOPIC_TABS.map((tab) => {
            const isActive = tab.code === topicCode;
            return (
              <Link
                key={tab.label}
                href={buildUrl(undefined, tab.code)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-3.5 text-xs sm:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-fg font-semibold shadow-xs"
                    : "bg-surface-muted hover:bg-surface-muted/80 text-fg hover:text-primary",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <nav aria-label="Jenis antrean" className="flex flex-wrap gap-1.5">
          {QUEUE_TABS.map((tab) => {
            const isActive = tab.kind === (kind ?? null);
            return (
              <Link
                key={tab.label}
                href={buildUrl(tab.kind, undefined)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors border",
                  isActive
                    ? "bg-secondary text-secondary-fg border-secondary font-semibold"
                    : "border-border bg-surface text-fg-muted hover:text-fg hover:bg-surface-muted",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <span className="text-xs text-fg-muted font-medium tabular-nums">
          Total {queue.total} isu terkumpul
        </span>
      </div>

      {queue.items.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {queue.items.map((item) => (
            <li key={item.issue_id}>
              <VerificationItem item={item} opds={opds.items} now={now.toISOString()} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Tidak ada isu pada topik ini"
          description="Semua laporan pada topik yang dipilih telah berhasil diteruskan ke dinas terkait."
        />
      )}

      <Pagination
        page={queue.page}
        limit={queue.limit}
        total={queue.total}
        basePath="/admin/verifikasi"
        params={paginationParams}
      />
    </div>
  );
}
