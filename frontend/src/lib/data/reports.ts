import { currentTime } from "@/lib/clock";
import { paginate, type PageParams } from "@/lib/data/paging";
import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { locationOf } from "@/lib/mock/reference";
import { allReports, reportStore } from "@/lib/mock/reports";
import type { Schema } from "@/lib/schema";

type Detail = Schema<"MyReportDetail">;
type Status = Schema<"IssueStatus">;

export interface CreateReportInput {
  title: string;
  body: string;
  villageId: string;
  visibility: Schema<"Visibility">;
}

export interface DuplicateInput {
  body: string;
  lat: number;
  lng: number;
}

const MAX_SUGGESTIONS = 3;
const SEARCH_RADIUS_M = 5000;
const MIN_WORD_LENGTH = 4;
const EARTH_RADIUS_M = 6_371_000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_SUFFIX_LENGTH = 4;
const CLOSED: readonly Status[] = ["SELESAI", "DITOLAK", "DIALIHKAN"];

function toSummaryItem(report: Detail): Schema<"MyReportSummary"> {
  return {
    code: report.code,
    title: report.title,
    status: report.status,
    visibility: report.visibility,
    created_at: report.created_at,
    issue_id: report.issue_id,
  };
}

function newCode(now: Date): string {
  const year = String(now.getFullYear() % 100).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(CODE_SUFFIX_LENGTH)), (value) =>
    CODE_ALPHABET.charAt(value % CODE_ALPHABET.length),
  ).join("");
  return `TLK-${year}${month}-${suffix}`;
}

function distanceMeters(a: Schema<"GeoPoint">, b: Schema<"GeoPoint">): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= MIN_WORD_LENGTH),
  );
}

export async function listMyReports(params: PageParams): Promise<Schema<"MyReportList">> {
  return paginate(allReports(currentTime()).map(toSummaryItem), params);
}

export async function getMyReport(code: string): Promise<Detail | null> {
  return allReports(currentTime()).find((report) => report.code === code) ?? null;
}

export async function createReport(input: CreateReportInput): Promise<Schema<"CreatedReport"> | null> {
  const now = currentTime();
  let location: Schema<"PublicLocation">;
  try {
    location = locationOf(input.villageId);
  } catch {
    return null;
  }
  const createdAt = now.toISOString();
  const code = newCode(now);
  reportStore().created.push({
    code,
    title: input.title || null,
    status: "DIAJUKAN",
    visibility: input.visibility,
    created_at: createdAt,
    issue_id: null,
    body: input.body,
    location,
    attachments: [],
    timeline: [
      {
        id: crypto.randomUUID(),
        at: createdAt,
        from_status: null,
        to_status: "DIAJUKAN",
        actor_label: "Sistem",
        note: null,
        evidence: [],
      },
    ],
    feedback: { can_submit: false, deadline: null, submitted: null },
    issue: null,
  });
  return { code, status: "DIAJUKAN", created_at: createdAt };
}

export async function suggestDuplicates(query: DuplicateInput): Promise<Schema<"DuplicateSuggestionList">> {
  const bodyWords = wordsOf(query.body);
  const matches = PUBLIC_ISSUES.filter((issue) => !CLOSED.includes(issue.status)).flatMap((issue) => {
    const distance = distanceMeters(query, issue.location.point);
    const overlap = [...wordsOf(issue.title)].filter((word) => bodyWords.has(word)).length;
    return distance <= SEARCH_RADIUS_M && overlap > 0 ? [{ issue, distance, overlap }] : [];
  });
  const items = matches
    .sort((a, b) => b.overlap - a.overlap || a.distance - b.distance)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ issue, distance }) => ({ issue: toSummary(issue), distance_m: Math.round(distance) }));
  return { items };
}

export async function supportIssue(id: string): Promise<Schema<"SupportResult"> | null> {
  const issue = PUBLIC_ISSUES.find((item) => item.id === id);
  if (!issue) {
    return null;
  }
  const now = currentTime();
  const code = newCode(now);
  reportStore().created.push({
    code,
    title: issue.title,
    status: issue.status,
    visibility: "PUBLIK",
    created_at: now.toISOString(),
    issue_id: issue.id,
    body: `Mendukung isu: ${issue.title}`,
    location: issue.location,
    attachments: [],
    timeline: issue.timeline,
    feedback: { can_submit: false, deadline: null, submitted: null },
    issue: toSummary(issue),
  });
  return { issue_id: issue.id, report_code: code, reporter_count: issue.reporter_count + 1 };
}

export async function submitFeedback(
  code: string,
  outcome: Schema<"FeedbackOutcome">,
): Promise<Schema<"FeedbackResult"> | null> {
  const report = await getMyReport(code);
  if (!report || !report.feedback.can_submit) {
    return null;
  }
  reportStore().feedback.set(code, outcome);
  return { issue_status: report.status };
}
