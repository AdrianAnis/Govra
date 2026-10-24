import { matchesQuery, paginate, type PageParams } from "@/lib/data/paging";
import { PUBLIC_ISSUES } from "@/lib/mock/issues";
import type { Schema } from "@/lib/schema";

export interface IssueFilters extends PageParams {
  q?: string | undefined;
  opd?: string | undefined;
  district_id?: string | undefined;
  status?: Schema<"IssueStatus"> | undefined;
  urgency?: Schema<"Urgency"> | undefined;
}

type Issue = Schema<"IssueDetail">;

function toSummary(issue: Issue): Schema<"IssueSummary"> {
  return {
    id: issue.id,
    title: issue.title,
    opd: issue.opd,
    category: issue.category,
    status: issue.status,
    urgency: issue.urgency,
    reporter_count: issue.reporter_count,
    location: issue.location,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    cover_photo: issue.cover_photo,
    response_overdue: issue.response_overdue,
  };
}

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

export async function listIssues(filters: IssueFilters = {}): Promise<Schema<"IssueList">> {
  const items = PUBLIC_ISSUES.filter((issue) => matches(issue, filters))
    .sort(byNewest)
    .map(toSummary);
  return paginate(items, filters);
}

export async function getIssue(id: string): Promise<Issue | null> {
  return PUBLIC_ISSUES.find((issue) => issue.id === id) ?? null;
}
