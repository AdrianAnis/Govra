import type { Metadata } from "next";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { AUDIT_ACTION_LABEL } from "@/lib/admin";
import { listAudit } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { parsePage, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Audit" };

const PAGE_SIZE = 20;
const HEADERS = ["Waktu", "Aksi", "Target", "Keterangan"] as const;

function first(value: string | string[] | undefined): string | undefined {
  const picked = Array.isArray(value) ? value[0] : value;
  return picked && Object.hasOwn(AUDIT_ACTION_LABEL, picked) ? picked : undefined;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const action = first(raw.action);
  const logs = await listAudit({ action, page: parsePage(raw), limit: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Audit" description="Catatan tindakan Admin. Hanya bisa dibaca." />
      <FilterBar
        selects={[
          {
            name: "action",
            label: "Filter aksi",
            allLabel: "Semua aksi",
            options: Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      {logs.items.length > 0 ? (
        <DataTable caption="Audit log" headers={HEADERS}>
          {logs.items.map((log) => (
            <DataRow key={log.id}>
              <RowHead>
                <span className="text-sm font-medium whitespace-nowrap">{formatDateTime(log.at)}</span>
              </RowHead>
              <DataCell className="text-sm font-semibold">{AUDIT_ACTION_LABEL[log.action] ?? log.action}</DataCell>
              <DataCell className="text-sm text-fg-muted">{log.target_type}</DataCell>
              <DataCell className="max-w-md text-sm">{log.detail ?? "-"}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Belum ada catatan" description="Tidak ada catatan untuk filter ini." />
      )}
      <Pagination
        page={logs.page}
        limit={logs.limit}
        total={logs.total}
        basePath="/admin/audit"
        params={action ? { action } : {}}
      />
    </div>
  );
}
