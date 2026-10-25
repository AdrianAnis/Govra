import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, type SelectFilter } from "@/components/filter-bar";
import { IssueMap, type IssueMarker } from "@/components/issue-map";
import { IssuePhotoCard } from "@/components/issue-photo-card";
import { IssueViewToggle } from "@/components/issue-view-toggle";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { buttonVariants } from "@/components/ui/button";
import { currentTime } from "@/lib/clock";
import { listIssues } from "@/lib/data/issues";
import { getDistricts, getOpds } from "@/lib/data/reference";
import { parseIssueFilters, parseIssueView } from "@/lib/search-params";
import type { Schema } from "@/lib/schema";
import { ISSUE_STATUS } from "@/lib/status";
import { activeParams, buildHref } from "@/lib/url";
import { cn } from "@/lib/utils";

const FIRST_ROW = 3;

export const metadata: Metadata = { title: "Isu Warga" };

const PAGE_SIZE = 8;
const MAP_LIMIT = 200;

const URGENCY_OPTIONS = [
  { value: "URGENT", label: "Urgent" },
  { value: "TINGGI", label: "Tinggi" },
  { value: "NORMAL", label: "Normal" },
];

function toMarker(issue: Schema<"IssueSummary">): IssueMarker {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    reporters: issue.reporter_count,
    village: issue.location.village.name,
    cover: issue.cover_photo?.url ?? null,
    lat: issue.location.point.lat,
    lng: issue.location.point.lng,
  };
}

async function loadSelects(): Promise<SelectFilter[]> {
  const [opds, districts] = await Promise.all([getOpds(), getDistricts()]);
  return [
    {
      name: "opd",
      label: "Filter OPD",
      allLabel: "Semua OPD",
      options: opds.items.map((opd) => ({ value: opd.slug, label: opd.name })),
    },
    {
      name: "district_id",
      label: "Filter kecamatan",
      allLabel: "Semua kecamatan",
      options: districts.items.map((district) => ({ value: district.id, label: district.name })),
    },
    {
      name: "status",
      label: "Filter status",
      allLabel: "Semua status",
      options: Object.entries(ISSUE_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: "urgency", label: "Filter urgensi", allLabel: "Semua urgensi", options: URGENCY_OPTIONS },
  ];
}

export default async function IssuesPage({ searchParams }: PageProps<"/isu">) {
  const raw = await searchParams;
  const filters = parseIssueFilters(raw);
  const view = parseIssueView(raw);
  const params = activeParams(filters);
  const [issues, selects] = await Promise.all([
    listIssues({ ...filters, limit: view === "peta" ? MAP_LIMIT : PAGE_SIZE }),
    loadSelects(),
  ]);
  const now = currentTime();

  return (
    <Container className="flex flex-col gap-6 py-10">
      <PageHeader
        title="Isu Warga"
        description="Laporan warga yang sudah diverifikasi dan diteruskan ke dinas. Lokasi hanya ditampilkan sampai tingkat kelurahan."
      />
      <IssueViewToggle view={view} params={params} />
      <FilterBar search={{ name: "q", label: "Cari isu, kategori, atau kelurahan" }} selects={selects} />
      <p aria-live="polite" className="text-sm text-fg-muted">
        Menampilkan {issues.items.length} dari {issues.total} isu
      </p>
      {issues.items.length > 0 && view === "peta" ? (
        <IssueMap key={buildHref("/isu", params, 1)} markers={issues.items.map(toMarker)} />
      ) : issues.items.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {issues.items.map((issue, index) => (
            <li key={issue.id}>
              <IssuePhotoCard issue={issue} now={now} eager={index < FIRST_ROW} heading="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Tidak ada isu yang cocok"
          description="Coba ubah kata kunci atau hapus sebagian filter."
          action={
            <Link href="/isu" className={cn(buttonVariants({ variant: "outline" }))}>
              Hapus filter
            </Link>
          }
        />
      )}
      {view === "daftar" && (
        <Pagination
          page={issues.page}
          limit={issues.limit}
          total={issues.total}
          basePath="/isu"
          params={params}
        />
      )}
    </Container>
  );
}
