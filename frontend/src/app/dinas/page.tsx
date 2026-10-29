import type { Metadata } from "next";
import { AdminDistributionMap } from "@/components/admin/admin-distribution-map";
import { InboxList } from "@/components/agency/inbox-list";
import { FilterBar, type SelectFilter } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { currentTime } from "@/lib/clock";
import { listAgencyIssues } from "@/lib/data/agency";
import { getDistributionPoints } from "@/lib/data/map";
import { getSessionUser } from "@/lib/data/session";
import { parseIssueFilters, type RawSearchParams } from "@/lib/search-params";
import { ISSUE_STATUS } from "@/lib/status";
import { activeParams } from "@/lib/url";

export const metadata: Metadata = { title: "Inbox Isu" };

const PAGE_SIZE = 20;
const INBOX_STATUSES = ["DITERUSKAN", "DIPROSES", "DIBUKA_ULANG", "SELESAI", "DITOLAK", "DIALIHKAN"] as const;

const SELECTS: SelectFilter[] = [
  {
    name: "status",
    label: "Filter status",
    allLabel: "Semua status",
    options: INBOX_STATUSES.map((value) => ({ value, label: ISSUE_STATUS[value].label })),
  },
  {
    name: "urgency",
    label: "Filter urgensi",
    allLabel: "Semua urgensi",
    options: [
      { value: "URGENT", label: "Urgent" },
      { value: "TINGGI", label: "Tinggi" },
      { value: "NORMAL", label: "Normal" },
    ],
  },
];

export default async function AgencyInboxPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = parseIssueFilters(await searchParams);
  const user = await getSessionUser();
  const [issues, mapPoints] = await Promise.all([
    listAgencyIssues(
      { status: filters.status, urgency: filters.urgency, page: filters.page, limit: PAGE_SIZE },
      user?.opdId || undefined,
    ),
    getDistributionPoints(user?.opdId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inbox Isu" description={user?.opdName ?? "Isu yang masuk ke OPD Anda."} />

      <AdminDistributionMap
        points={mapPoints}
        mode="dinas"
        title={`Peta Sebaran Laporan · ${user?.opdName ?? "Wilayah Dinas"}`}
      />

      <FilterBar selects={SELECTS} />
      <p aria-live="polite" className="text-sm text-fg-muted">
        Urut berdasarkan urgensi, batas SLA, lalu jumlah pelapor. {issues.total} isu.
      </p>
      {issues.items.length > 0 ? (
        <InboxList issues={issues.items} now={currentTime()} />
      ) : (
        <EmptyState title="Tidak ada isu" description="Tidak ada isu yang cocok dengan filter yang dipilih." />
      )}
      <Pagination
        page={issues.page}
        limit={issues.limit}
        total={issues.total}
        basePath="/dinas"
        params={activeParams({ status: filters.status, urgency: filters.urgency })}
      />
    </div>
  );
}
