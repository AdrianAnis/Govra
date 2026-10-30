import { PUBLIC_ISSUES } from "@/lib/mock/issues";
import { PROGRAM_DETAILS } from "@/lib/mock/programs";
import { DISTRICTS, GOALS, OPDS, REGION } from "@/lib/mock/reference";
import { SCORECARD } from "@/lib/mock/scorecard";
import type { Schema } from "@/lib/schema";

type OpdSeed = (typeof OPDS)[number];

interface ApiOpd {
  id: string;
  code: string;
  name: string;
  slug: string;
  total_proker?: number;
}

const CLOSED_STATUSES: readonly Schema<"IssueStatus">[] = ["SELESAI", "DITOLAK"];

function summarize({ ref, categories }: OpdSeed): Schema<"OpdSummary"> {
  return {
    ...ref,
    categories,
    program_count: PROGRAM_DETAILS.filter((program) => program.opd.code === ref.code).length,
    open_issue_count: PUBLIC_ISSUES.filter(
      (issue) => issue.opd.code === ref.code && !CLOSED_STATUSES.includes(issue.status),
    ).length,
  };
}

function issueStats(opdCode: string): Schema<"StatusCount">[] {
  const counts = new Map<Schema<"IssueStatus">, number>();
  for (const issue of PUBLIC_ISSUES) {
    if (issue.opd.code === opdCode) {
      counts.set(issue.status, (counts.get(issue.status) ?? 0) + 1);
    }
  }
  return [...counts].map(([status, count]) => ({ status, count }));
}

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

export async function getRegion(): Promise<Schema<"Region">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/region`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return {
          name: data.name,
          head_label: data.head_label || REGION.head_label,
          is_simulation: REGION.is_simulation,
          period: REGION.period,
          bounds: REGION.bounds,
        };
      }
    }
  } catch {}
  return REGION;
}

export async function getDistricts(): Promise<Schema<"DistrictList">> {
  const apiBase = (process.env.API_BASE_URL || "http://127.0.0.1:8080").replace("localhost", "127.0.0.1");
  try {
    const res = await fetch(`${apiBase}/districts`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = data.map((d: { id: string; name: string; villages?: { id: string; name: string }[] }) => ({
          ...d,
          villages: Array.isArray(d.villages) ? d.villages : [],
        }));
        return { items: cleaned as unknown as Schema<"District">[] };
      }
    }
  } catch {}
  return { items: DISTRICTS };
}

export async function getGoals(): Promise<Schema<"GoalList">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/goals`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { items: data };
      }
    }
  } catch {}
  return { items: GOALS };
}

export async function getOpds(): Promise<Schema<"OpdSummaryList">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/opds`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          items: data.map((o: ApiOpd) => ({
            code: o.code,
            name: o.name,
            slug: o.slug,
            categories: [],
            program_count: o.total_proker ?? 0,
            open_issue_count: 0,
          })),
        };
      }
    }
  } catch {}
  return { items: OPDS.map(summarize) };
}

export async function getOpd(slug: string): Promise<Schema<"OpdProfile"> | null> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/opds/${encodeURIComponent(slug)}`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.code) {
        return {
          code: data.code,
          name: data.name,
          slug: data.slug,
          categories: [],
          program_count: data.total_proker ?? 0,
          open_issue_count: 0,
          indicators: [],
          issue_stats: [],
        };
      }
    }
  } catch {}

  const opd = OPDS.find((item) => item.ref.slug === slug);
  if (!opd) {
    return null;
  }
  const scorecard = SCORECARD.by_opd.find((item) => item.opd.code === opd.ref.code);
  return {
    ...summarize(opd),
    indicators: scorecard?.indicators ?? [],
    issue_stats: issueStats(opd.ref.code),
  };
}
