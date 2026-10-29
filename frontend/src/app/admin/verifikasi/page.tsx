import type { Metadata } from "next";
import { VerificationFilters } from "@/components/admin/verification-filters";
import { VerificationTable } from "@/components/admin/verification-table";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { listOpdsAdmin, listVerification } from "@/lib/data/admin";
import { currentTime } from "@/lib/clock";
import { parsePage, type RawSearchParams } from "@/lib/search-params";
import type { Schema } from "@/lib/schema";

export const metadata: Metadata = { title: "Verifikasi & Klasifikasi Topik" };

const PAGE_SIZE = 20;

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

  const paginationParams: Record<string, string> = {};
  if (kind) paginationParams.jenis = kind;
  if (topicCode) paginationParams.topik = topicCode;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Verifikasi & Klasifikasi Topik"
        description="Hasil klasifikasi AI Gemini berdasarkan topik masalah dan kedekatan wilayah laporan warga."
      />

      <VerificationFilters totalCount={queue.total} />

      {queue.items.length > 0 ? (
        <VerificationTable
          key={`${kind || "ALL"}-${topicCode || "ALL"}-${queue.page}`}
          items={queue.items as any}
          opds={opds.items}
          now={now.toISOString()}
        />
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
