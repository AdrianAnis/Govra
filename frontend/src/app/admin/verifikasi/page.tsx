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

export const metadata: Metadata = { title: "Verifikasi" };

const PAGE_SIZE = 20;

const TABS: ReadonlyArray<{ kind: Schema<"VerificationKind"> | null; label: string }> = [
  { kind: null, label: "Semua" },
  { kind: "VERIFIKASI", label: "Verifikasi" },
  { kind: "PENGALIHAN", label: "Pengalihan" },
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
  const [queue, opds] = await Promise.all([
    listVerification({ kind, page: parsePage(raw), limit: PAGE_SIZE }),
    listOpdsAdmin(),
  ]);
  const now = currentTime();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Verifikasi"
        description="Isu yang belum punya OPD tujuan dan permintaan pengalihan dari Dinas."
      />
      <nav aria-label="Jenis antrean" className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.kind ? `/admin/verifikasi?jenis=${tab.kind}` : "/admin/verifikasi"}
            aria-current={tab.kind === (kind ?? null) ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium hover:bg-primary-soft",
              tab.kind === (kind ?? null) && "bg-secondary font-semibold text-secondary-fg hover:bg-secondary",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {queue.items.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {queue.items.map((item) => (
            <li key={item.issue_id}>
              <VerificationItem item={item} opds={opds.items} now={now.toISOString()} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Antrean kosong" description="Tidak ada isu yang menunggu keputusan Admin." />
      )}
      <Pagination
        page={queue.page}
        limit={queue.limit}
        total={queue.total}
        basePath="/admin/verifikasi"
        params={kind ? { jenis: kind } : {}}
      />
    </div>
  );
}
