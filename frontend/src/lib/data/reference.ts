import { PUBLIC_ISSUES } from "@/lib/mock/issues";
import { PROGRAM_DETAILS } from "@/lib/mock/programs";
import { DISTRICTS, GOALS, OPDS, REGION } from "@/lib/mock/reference";
import { SCORECARD } from "@/lib/mock/scorecard";
import type { Schema } from "@/lib/schema";

type OpdSeed = (typeof OPDS)[number];

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

export async function getRegion(): Promise<Schema<"Region">> {
  return REGION;
}

export async function getDistricts(): Promise<Schema<"DistrictList">> {
  return { items: DISTRICTS };
}

export async function getGoals(): Promise<Schema<"GoalList">> {
  return { items: GOALS };
}

export async function getOpds(): Promise<Schema<"OpdSummaryList">> {
  return { items: OPDS.map(summarize) };
}

export async function getOpd(slug: string): Promise<Schema<"OpdProfile"> | null> {
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
