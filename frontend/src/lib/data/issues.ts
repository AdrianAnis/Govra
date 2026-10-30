import { matchesQuery, paginate, type PageParams } from "@/lib/data/paging";
import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import type { Schema } from "@/lib/schema";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export interface IssueFilters extends PageParams {
  q?: string | undefined;
  opd?: string | undefined;
  district_id?: string | undefined;
  status?: Schema<"IssueStatus"> | undefined;
  urgency?: Schema<"Urgency"> | undefined;
}

interface ApiPoint {
  lat?: number;
  lng?: number;
}

interface ApiEvent {
  id: string;
  from_status?: string | null;
  to_status: string;
  author_name?: string;
  note?: string;
  evidence_photos?: string[];
  created_at?: string;
}

interface ApiIssue {
  id: string;
  code?: string;
  title: string;
  opd_id?: string;
  opd_code?: string;
  opd_name?: string;
  opd_slug?: string;
  category_id?: string;
  category_name?: string;
  district_id?: string;
  district_name?: string;
  village_id?: string;
  village_name?: string;
  point?: ApiPoint;
  address_detail?: string;
  status?: string;
  urgency?: string;
  safety_risk?: string;
  unique_reporters_count?: number;
  sla_due_at?: string;
  created_at?: string;
  updated_at?: string;
  events?: ApiEvent[];
}

type Issue = Schema<"IssueDetail">;

function matches(issue: Issue, filters: IssueFilters): boolean {
  const searchable = `${issue.title} ${issue.category.name} ${issue.location.village.name} ${issue.location.district.name}`;
  return (
    matchesQuery(searchable, filters.q) &&
    (!filters.opd || issue.opd.slug === filters.opd) &&
    (!filters.district_id || issue.location.district.id === filters.district_id) &&
    (!filters.status || issue.status === filters.status) &&
    (!filters.urgency || issue.urgency === filters.urgency)
  );
}

const byNewest = (a: Issue, b: Issue) => Date.parse(b.updated_at) - Date.parse(a.updated_at);

function mapApiToIssue(item: ApiIssue): Issue {
  const opdCode = item.opd_code || "BMSDA";
  return {
    id: item.id,
    title: item.title,
    opd: {
      code: opdCode,
      name: item.opd_name || "Dinas Bina Marga dan Sumber Daya Air",
      slug: (item.opd_slug || opdCode).toLowerCase(),
    },
    category: {
      code: item.category_name ? item.category_name.toUpperCase().replace(/\s+/g, "_") : "JALAN_RUSAK",
      name: item.category_name || "Jalan rusak",
    },
    location: {
      district: {
        id: item.district_id || "0197a000-0000-7000-8000-000000000001",
        name: item.district_name || "Kecamatan Utara",
      },
      village: {
        id: item.village_id || "0197a000-0000-7000-8000-000000000011",
        name: item.village_name || "Kelurahan Melati",
      },
      point: {
        lat: item.point?.lat ?? -6.2088,
        lng: item.point?.lng ?? 106.8456,
      },
    },
    status: (item.status || "MENUNGGU_VERIFIKASI") as Schema<"IssueStatus">,
    urgency: (item.urgency || "NORMAL") as Schema<"Urgency">,
    reporter_count: item.unique_reporters_count ?? 1,
    cover_photo: null,
    response_overdue: false,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    timeline: (item.events || []).map((e: ApiEvent) => ({
      id: e.id,
      at: e.created_at || new Date().toISOString(),
      from_status: (e.from_status as Schema<"IssueStatus">) || null,
      to_status: (e.to_status as Schema<"IssueStatus">) || "MENUNGGU_VERIFIKASI",
      actor_label: e.author_name || "Sistem",
      note: e.note || null,
      evidence: [],
    })),
  };
}

export async function listIssues(filters: IssueFilters = {}): Promise<Schema<"IssueList">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/issues`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : data?.items;
      if (Array.isArray(rawList) && rawList.length > 0) {
        const details = (rawList as ApiIssue[]).map(mapApiToIssue);
        const filtered = details.filter((issue) => matches(issue, filters)).sort(byNewest).map(toSummary);
        return paginate(filtered, filters);
      }
    }
  } catch {}

  const items = PUBLIC_ISSUES.filter((issue) => matches(issue, filters))
    .sort(byNewest)
    .map(toSummary);
  return paginate(items, filters);
}

export async function getIssue(id: string): Promise<Issue | null> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/issues/${encodeURIComponent(id)}`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return mapApiToIssue(data as ApiIssue);
      }
    }
  } catch {}
  return PUBLIC_ISSUES.find((issue) => issue.id === id) ?? null;
}
