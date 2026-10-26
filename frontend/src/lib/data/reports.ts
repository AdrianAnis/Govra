import { cookies } from "next/headers";
import { currentTime } from "@/lib/clock";
import { paginate, type PageParams } from "@/lib/data/paging";
import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { locationOf } from "@/lib/mock/reference";
import { allReports, reportStore } from "@/lib/mock/reports";
import type { Schema } from "@/lib/schema";

export type Detail = Schema<"MyReportDetail"> & { address_detail?: string | null };

export interface CreateReportInput {
  title: string;
  body: string;
  villageId: string;
  visibility: Schema<"Visibility">;
  lat?: number;
  lng?: number;
  attachments?: Schema<"Attachment">[];
}

export interface DuplicateInput {
  body: string;
  lat: number;
  lng: number;
}

interface ApiReportSummary {
  code: string;
  title: string | null;
  status: Schema<"IssueStatus">;
  visibility: string;
  created_at: string;
  issue_id?: string | null;
}

interface ApiTimelineEvent {
  created_at?: string;
  status: Schema<"IssueStatus">;
  note?: string | null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_SUFFIX_LENGTH = 4;

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

function randomSuffix(): string {
  let result = "";
  for (let i = 0; i < CODE_SUFFIX_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * CODE_ALPHABET.length);
    result += CODE_ALPHABET[index];
  }
  return result;
}

function newCode(now: Date): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `GVR-${yy}${mm}-${randomSuffix()}`;
}

export async function listMyReports(params: PageParams): Promise<Schema<"MyReportList">> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const headers: Record<string, string> = {
      "X-BFF-Key": process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${apiBase}/me/reports`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const rawItems: ApiReportSummary[] = data.items || [];
      const items: Schema<"MyReportSummary">[] = rawItems.map((r) => ({
        code: r.code,
        title: r.title,
        status: r.status,
        visibility: r.visibility === "CONFIDENTIAL" || r.visibility === "RAHASIA" ? "RAHASIA" : "PUBLIK",
        created_at: r.created_at,
        issue_id: r.issue_id ?? null,
      }));
      return paginate(items, params);
    }
  } catch {}
  return paginate(allReports(currentTime()).map(toSummaryItem), params);
}

export async function getMyReport(code: string): Promise<Detail | null> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const headers: Record<string, string> = {
      "X-BFF-Key": process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${apiBase}/me/reports/${encodeURIComponent(code)}`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const r = await res.json();
      let loc: Schema<"PublicLocation">;
      try {
        loc = locationOf(r.village_id);
      } catch {
        loc = {
          district: { id: r.district_id || "", name: r.district_name || "Kecamatan" },
          village: { id: r.village_id || "", name: r.village_name || "Kelurahan" },
          point: { lat: r.lat, lng: r.lng },
        };
      }
      const timelineRaw: ApiTimelineEvent[] = r.timeline || [];
      const rawAttachments = Array.isArray(r.attachments) ? r.attachments : [];
      const attachments: Schema<"Attachment">[] = rawAttachments.map((a: Record<string, unknown>, idx: number) => ({
        id: typeof a.id === "string" ? a.id : `att-${idx}`,
        url: typeof a.url === "string" ? a.url : typeof a.file_url === "string" ? a.file_url : "",
        mime: (typeof a.mime === "string" ? a.mime : typeof a.mime_type === "string" ? a.mime_type : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp",
        size_bytes: typeof a.size_bytes === "number" ? a.size_bytes : typeof a.file_size === "number" ? a.file_size : 0,
      }));
      return {
        code: r.code,
        title: r.title || null,
        status: r.status,
        visibility: r.visibility === "CONFIDENTIAL" || r.visibility === "RAHASIA" ? "RAHASIA" : "PUBLIK",
        created_at: r.created_at,
        issue_id: r.issue_id || null,
        body: r.description,
        location: loc,
        address_detail: r.address_detail || null,
        attachments,
        timeline: timelineRaw.map((t, idx) => ({
          id: `evt-${idx}`,
          at: t.created_at || r.created_at,
          from_status: null,
          to_status: t.status,
          actor_label: "Sistem",
          note: t.note || null,
          evidence: [],
        })),
        feedback: { can_submit: false, deadline: null, submitted: null },
        issue: null,
      };
    }
  } catch {}
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
    attachments: input.attachments || [],
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

export async function suggestDuplicates(input?: DuplicateInput): Promise<Schema<"DuplicateSuggestionList">> {
  void input;
  return { items: [] };
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
    body: `Mendukung penanganan isu "${issue.title}".`,
    location: issue.location,
    attachments: [],
    timeline: issue.timeline,
    feedback: { can_submit: false, deadline: null, submitted: null },
    issue: toSummary(issue),
  });
  issue.reporter_count += 1;
  return { issue_id: issue.id, report_code: code, reporter_count: issue.reporter_count };
}

export async function submitResolutionFeedback(
  code: string,
  outcome: Schema<"FeedbackOutcome">,
  note?: string,
): Promise<Schema<"FeedbackResult"> | null> {
  void note;
  const report = allReports(currentTime()).find((r) => r.code === code);
  if (!report) {
    return null;
  }
  reportStore().feedback.set(code, outcome);
  const nextStatus: Schema<"IssueStatus"> = outcome === "CONFIRM" ? "SELESAI" : "MENUNGGU_VERIFIKASI";
  report.status = nextStatus;
  report.feedback = {
    can_submit: false,
    deadline: report.feedback.deadline,
    submitted: outcome,
  };
  return { issue_status: nextStatus };
}

export const submitFeedback = submitResolutionFeedback;
