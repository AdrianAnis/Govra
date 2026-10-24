import type { Metadata } from "next";
import Link from "next/link";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { IssueStatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { listMyReports } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/format";
import { parsePage } from "@/lib/search-params";

export const metadata: Metadata = { title: "Laporan Saya" };

const PAGE_SIZE = 10;
const HEADERS = ["Kode", "Laporan", "Status", "Dikirim"] as const;

const VISIBILITY_LABEL = { PUBLIK: "Publik", RAHASIA: "Rahasia" } as const;

export default async function MyReportsPage({ searchParams }: PageProps<"/laporan-saya">) {
  const page = parsePage(await searchParams);
  const reports = await listMyReports({ page, limit: PAGE_SIZE });

  return (
    <Container className="flex flex-col gap-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Laporan Saya" description="Pantau status laporan yang pernah Anda kirim." />
        <Link href="/lapor" className={buttonVariants()}>
          Buat laporan baru
        </Link>
      </div>
      {reports.items.length === 0 ? (
        <EmptyState
          title="Belum ada laporan"
          description="Laporan yang Anda kirim akan muncul di sini beserta perkembangannya."
        />
      ) : (
        <DataTable caption="Daftar laporan Anda" headers={HEADERS}>
          {reports.items.map((report) => (
            <DataRow key={report.code}>
              <RowHead>
                <Link
                  href={`/laporan-saya/${report.code}`}
                  className="tabular-nums underline-offset-4 hover:text-primary hover:underline"
                >
                  {report.code}
                </Link>
              </RowHead>
              <DataCell>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{report.title ?? "Tanpa judul"}</span>
                  <span className="text-sm text-fg-muted">{VISIBILITY_LABEL[report.visibility]}</span>
                </span>
              </DataCell>
              <DataCell>
                <IssueStatusBadge status={report.status} />
              </DataCell>
              <DataCell className="text-sm text-fg-muted">{formatDateTime(report.created_at)}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      )}
      <Pagination
        page={reports.page}
        limit={reports.limit}
        total={reports.total}
        basePath="/laporan-saya"
        params={{}}
      />
    </Container>
  );
}
