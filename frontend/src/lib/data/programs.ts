import { matchesQuery, paginate, type PageParams } from "@/lib/data/paging";
import { PROGRAM_DETAILS } from "@/lib/mock/programs";
import type { Schema } from "@/lib/schema";

export interface ProgramFilters extends PageParams {
  q?: string | undefined;
  opd?: string | undefined;
  district_id?: string | undefined;
  goal?: string | undefined;
  status?: Schema<"ProgramStatus"> | undefined;
}

interface ApiMilestone {
  id: string;
  title: string;
  target_date: string;
  completed_at?: string | null;
  is_completed?: boolean;
}

interface ApiUpdate {
  id: string;
  title: string;
  content: string;
  progress_percentage?: number;
  documentation_photos?: string[];
  created_at: string;
}

interface ApiProgram {
  code: string;
  name: string;
  opd_id?: string;
  opd_code?: string;
  opd_name?: string;
  goal_id?: string;
  goal_code?: string;
  district_id?: string;
  district_name?: string;
  status?: string;
  progress?: number;
  expected_progress?: number;
  expected?: number;
  start_date?: string;
  end_date?: string;
  related_issues?: number;
  budget?: { pagu?: number; realization?: number };
  milestones?: ApiMilestone[];
  updates?: ApiUpdate[];
}

type Program = Schema<"ProgramDetail">;

function toSummary(program: Program): Schema<"ProgramSummary"> {
  return {
    code: program.code,
    name: program.name,
    opd: program.opd,
    goal: program.goal,
    district: program.district,
    status: program.status,
    progress_percent: program.progress_percent,
    expected_percent: program.expected_percent,
    start_date: program.start_date,
    end_date: program.end_date,
    related_issue_count: program.related_issue_count,
  };
}

function matches(program: Program, filters: ProgramFilters): boolean {
  const searchable = `${program.code} ${program.name} ${program.opd.name} ${program.district.name} ${program.goal.name}`;
  return (
    matchesQuery(searchable, filters.q) &&
    (!filters.opd || program.opd.slug === filters.opd) &&
    (!filters.district_id || program.district.id === filters.district_id) &&
    (!filters.goal || program.goal.code === filters.goal) &&
    (!filters.status || program.status === filters.status)
  );
}

function mapApiToDetail(item: ApiProgram): Program {
  const opdCode = item.opd_code || "BMSDA";
  return {
    code: item.code,
    name: item.name,
    opd: {
      code: opdCode,
      name: item.opd_name || "Dinas Bina Marga dan Sumber Daya Air",
      slug: (item.opd_code || "bmsda").toLowerCase(),
    },
    goal: {
      code: item.goal_code || "INFRA_JALAN",
      name: "Infrastruktur jalan mantap",
    },
    district: {
      id: item.district_id || "0197a000-0000-7000-8000-000000000001",
      name: item.district_name || "Kecamatan Utara",
    },
    status: (item.status || "SESUAI_JADWAL") as Schema<"ProgramStatus">,
    progress_percent: item.progress ?? 50,
    expected_percent: item.expected_progress ?? item.expected ?? 50,
    start_date: item.start_date || "2026-01-01",
    end_date: item.end_date || "2026-12-31",
    related_issue_count: item.related_issues ?? 0,
    indicator: "Persentase Capaian Program",
    target: 100,
    unit: "%",
    realization: item.progress ?? 50,
    budget: {
      ceiling: item.budget?.pagu ?? 0,
      realized: item.budget?.realization ?? 0,
    },
    milestones: (item.milestones || []).map((m: ApiMilestone) => ({
      name: m.title,
      due_date: m.target_date,
      done: Boolean(m.is_completed),
    })),
    documentation: [],
    updates: (item.updates || []).map((u: ApiUpdate) => ({
      date: u.created_at ? u.created_at.slice(0, 10) : "2026-10-24",
      note: u.title ? `${u.title}: ${u.content}` : u.content,
      progress_percent: u.progress_percentage ?? 0,
    })),
  };
}

export async function listPrograms(filters: ProgramFilters = {}): Promise<Schema<"ProgramList">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/programs`, { next: { revalidate: 10 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const details = (data as ApiProgram[]).map(mapApiToDetail);
        const filtered = details.filter((p) => matches(p, filters)).map(toSummary);
        return paginate(filtered, filters);
      }
    }
  } catch {}
  const items = PROGRAM_DETAILS.filter((program) => matches(program, filters)).map(toSummary);
  return paginate(items, filters);
}

export async function getProgram(code: string): Promise<Program | null> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/programs/${encodeURIComponent(code)}`, { next: { revalidate: 10 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.code) {
        return mapApiToDetail(data as ApiProgram);
      }
    }
  } catch {}
  return PROGRAM_DETAILS.find((program) => program.code === code) ?? null;
}
