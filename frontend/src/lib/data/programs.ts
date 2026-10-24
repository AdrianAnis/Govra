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

export async function listPrograms(filters: ProgramFilters = {}): Promise<Schema<"ProgramList">> {
  const items = PROGRAM_DETAILS.filter((program) => matches(program, filters)).map(toSummary);
  return paginate(items, filters);
}

export async function getProgram(code: string): Promise<Program | null> {
  return PROGRAM_DETAILS.find((program) => program.code === code) ?? null;
}
