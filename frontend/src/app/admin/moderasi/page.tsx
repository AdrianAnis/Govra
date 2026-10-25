import type { Metadata } from "next";
import { HideReport } from "@/components/admin/hide-report";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { Badge } from "@/components/ui/badge";
import { MODERATION_LABEL } from "@/lib/admin";
import { listModeration } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { parsePage, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Moderasi" };

const PAGE_SIZE = 20;
const HEADERS = ["Laporan", "Visibilitas", "Dibuat", "Status", "Tindakan"] as const;

function first(value: string | string[] | undefined): string | undefined {
  const picked = Array.isArray(value) ? value[0] : value;
  return picked ? picked.trim().slice(0, 100) : undefined;
}

function parseHidden(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  return value === "false" ? false : undefined;
}

export default async function AdminModerationPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const q = first(raw.q);
  const hidden = first(raw.hidden);
  const reports = await listModeration({ q, hidden: parseHidden(hidden), page: parsePage(raw), limit: PAGE_SIZE });
  const params: Record<string, string> = {};
  if (q) {
    params.q = q;
  }
  if (hidden) {
    params.hidden = hidden;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Moderasi" description="Cari laporan lalu sembunyikan yang berisi spam atau SARA." />
      <FilterBar
        search={{ name: "q", label: "Cari kode atau isi laporan" }}
        selects={[
          {
            name: "hidden",
            label: "Filter status",
            allLabel: "Semua status",
            options: [
              { value: "false", label: "Tampil" },
              { value: "true", label: "Disembunyikan" },
            ],
          },
        ]}
      />
      {reports.items.length > 0 ? (
        <DataTable caption="Laporan untuk moderasi" headers={HEADERS}>
          {reports.items.map((report) => (
            <DataRow key={report.id}>
              <RowHead>
                <span className="flex max-w-md flex-col gap-0.5">
                  <span>{report.code}</span>
                  <span className="line-clamp-2 text-sm font-normal text-fg-muted">{report.body}</span>
                </span>
              </RowHead>
              <DataCell className="text-sm">{report.visibility === "RAHASIA" ? "Rahasia" : "Publik"}</DataCell>
              <DataCell className="text-sm text-fg-muted">{formatDateTime(report.created_at)}</DataCell>
              <DataCell>
                {report.hidden ? (
                  <Badge weight="serius">
                    Disembunyikan{report.hide_reason ? `: ${MODERATION_LABEL[report.hide_reason]}` : ""}
                  </Badge>
                ) : (
                  <Badge weight="netral">Tampil</Badge>
                )}
              </DataCell>
              <DataCell>{report.hidden ? null : <HideReport id={report.id} code={report.code} />}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Tidak ada laporan" description="Tidak ada laporan yang cocok dengan pencarian ini." />
      )}
      <Pagination
        page={reports.page}
        limit={reports.limit}
        total={reports.total}
        basePath="/admin/moderasi"
        params={params}
      />
    </div>
  );
}
