import { currentTime } from "@/lib/clock";
import type { Outcome } from "@/lib/data/outcome";
import { paginate, type PageParams } from "@/lib/data/paging";
import {
  REJECTION_LABEL,
  TRANSFER_LABEL,
  type AgencyTransition,
  type TransitionInput,
} from "@/lib/agency";
import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { agencyStore, type Publication } from "@/lib/mock/agency";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { checkFile } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

type Issue = Schema<"IssueDetail">;
type Status = Schema<"IssueStatus">;
type Urgency = Schema<"Urgency">;
type AgencyAttachment = Schema<"AgencyAttachment">;
type AgencyReport = Schema<"AgencyReport">;

export interface AgencyFilters extends PageParams {
  status?: Status | undefined;
  urgency?: Urgency | undefined;
}

const MS_PER_HOUR = 3_600_000;
const NO_DUE = Number.MAX_SAFE_INTEGER;
const MAX_REPORTS = 3;
const SLA_HOURS: Record<Urgency, number> = { URGENT: 24, TINGGI: 72, NORMAL: 120 };
const URGENCY_RANK: Record<Urgency, number> = { URGENT: 3, TINGGI: 2, NORMAL: 1 };
const AWAITING: readonly Status[] = ["DITERUSKAN", "DIBUKA_ULANG"];
const OPEN: readonly Status[] = ["DITERUSKAN", "DIPROSES", "DIBUKA_ULANG"];
const PHOTOS = ["/issues/banjir-hd.jpg", "/issues/jembatan-hd.jpg", "/issues/pagar-hd.jpg", "/issues/atap-hd.jpg"];
const SAFETY: Record<Urgency, Schema<"SafetyRisk">> = { URGENT: "LIFE", TINGGI: "PROPERTY", NORMAL: "NONE" };
const REPORT_BODIES: ReadonlyArray<(title: string) => string> = [
  (title) => `${title}. Sudah berlangsung beberapa hari dan belum ada perbaikan sama sekali.`,
  (title) => `Mohon segera ditangani: ${title.toLowerCase()}. Warga sekitar mulai khawatir.`,
  (title) => `Saya ingin melaporkan hal yang sama, ${title.toLowerCase()}. Mohon identitas saya dirahasiakan.`,
];
const AI_CONFIDENCE = 0.92;
const EVIDENCE_PATH = "/api/agency/evidence";
const REPORT_SPACING_HOURS = 5;

function agencyIssues(): Issue[] {
  const code = DEMO_PROFILES.dinas.opd?.code;
  const added = agencyStore().events;
  return PUBLIC_ISSUES.filter((issue) => issue.opd.code === code).map((issue) => {
    const extra = added.get(issue.id) ?? [];
    if (extra.length === 0) {
      return issue;
    }
    const timeline = [...issue.timeline, ...extra];
    const last = timeline[timeline.length - 1];
    return {
      ...issue,
      timeline,
      status: last ? last.to_status : issue.status,
      updated_at: last ? last.at : issue.updated_at,
    };
  });
}

function slaDueAt(issue: Issue): string | null {
  if (!AWAITING.includes(issue.status)) {
    return null;
  }
  const waiting = [...issue.timeline].reverse().find((event) => event.to_status === issue.status);
  return waiting ? new Date(Date.parse(waiting.at) + SLA_HOURS[issue.urgency] * MS_PER_HOUR).toISOString() : null;
}

function toAgencySummary(issue: Issue): Schema<"AgencyIssueSummary"> {
  return { ...toSummary(issue), sla_due_at: slaDueAt(issue) };
}

function dueMs(issue: Schema<"AgencyIssueSummary">): number {
  return issue.sla_due_at ? Date.parse(issue.sla_due_at) : NO_DUE;
}

function byPriority(a: Schema<"AgencyIssueSummary">, b: Schema<"AgencyIssueSummary">): number {
  return URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] || dueMs(a) - dueMs(b) || b.reporter_count - a.reporter_count;
}

export function allowedTransitions(status: Status): AgencyTransition[] {
  switch (status) {
    case "DITERUSKAN":
      return ["DIPROSES", "DITOLAK", "DIALIHKAN"];
    case "DIPROSES":
      return ["SELESAI", "DITOLAK", "DIALIHKAN"];
    case "DIBUKA_ULANG":
      return ["DIPROSES"];
    default:
      return [];
  }
}

function publicationOf(id: string, fallback: Publication): Publication {
  return agencyStore().publication.get(id) ?? fallback;
}

function reportsOf(issue: Issue): AgencyReport[] {
  const tail = Number(issue.id.slice(-3));
  const count = Math.min(issue.reporter_count, MAX_REPORTS);
  return Array.from({ length: count }, (_, reportIndex) => {
    const visibility: Schema<"Visibility"> = reportIndex === MAX_REPORTS - 1 ? "RAHASIA" : "PUBLIK";
    const urls =
      visibility === "RAHASIA"
        ? []
        : reportIndex === 0
          ? [issue.cover_photo?.url ?? PHOTOS[tail % PHOTOS.length], PHOTOS[(tail + 1) % PHOTOS.length]]
          : [PHOTOS[(tail + 2) % PHOTOS.length]];
    const attachments = urls.flatMap((url, photoIndex): AgencyAttachment[] => {
      if (!url) {
        return [];
      }
      const id = `0197d100-0000-7000-8000-${issue.id.slice(-9)}${reportIndex}${photoIndex}0`;
      const isFirst = reportIndex === 0 && photoIndex === 0 && issue.cover_photo !== null;
      const state = publicationOf(id, { public_ok: isFirst, is_cover: isFirst });
      return [{ id, url, mime: "image/jpeg", size_bytes: 312_000, ...state }];
    });
    return {
      code: `TLK-2610-A${String(tail).padStart(2, "0")}${reportIndex}`,
      body: REPORT_BODIES[reportIndex]?.(issue.title) ?? issue.title,
      visibility,
      created_at: new Date(Date.parse(issue.created_at) + reportIndex * REPORT_SPACING_HOURS * MS_PER_HOUR).toISOString(),
      location: issue.location,
      attachments,
    };
  });
}

export async function listAgencyIssues(filters: AgencyFilters = {}): Promise<Schema<"AgencyIssueList">> {
  const items = agencyIssues()
    .filter((issue) => (!filters.status || issue.status === filters.status) && (!filters.urgency || issue.urgency === filters.urgency))
    .map(toAgencySummary)
    .sort(byPriority);
  return paginate(items, filters);
}

export async function getAgencyIssue(id: string): Promise<Schema<"AgencyIssueDetail"> | null> {
  const issue = agencyIssues().find((item) => item.id === id);
  if (!issue) {
    return null;
  }
  return {
    ...toAgencySummary(issue),
    ai: { summary: issue.title, confidence: AI_CONFIDENCE, safety_risk: SAFETY[issue.urgency], sensitive: false },
    reports: reportsOf(issue),
    timeline: issue.timeline,
    allowed_transitions: allowedTransitions(issue.status),
  };
}

export async function transitionIssue(id: string, input: TransitionInput): Promise<Outcome<Schema<"TransitionResult">>> {
  const issue = agencyIssues().find((item) => item.id === id);
  if (!issue) {
    return { ok: false, status: 404, message: "Isu tidak ditemukan." };
  }
  if (!allowedTransitions(issue.status).includes(input.to)) {
    return { ok: false, status: 409, message: "Perubahan status ini tidak diizinkan untuk isu ini." };
  }
  const store = agencyStore();
  const evidence = (input.evidence_ids ?? []).flatMap((evidenceId) => store.evidence.get(evidenceId)?.attachment ?? []);
  if (input.to === "SELESAI" && evidence.length === 0) {
    return { ok: false, status: 422, message: "Unggah minimal satu foto bukti." };
  }
  const reason =
    input.to === "DITOLAK" && input.rejection_reason
      ? `${REJECTION_LABEL[input.rejection_reason]}. `
      : input.to === "DIALIHKAN" && input.transfer_reason
        ? `${TRANSFER_LABEL[input.transfer_reason]}. `
        : "";
  const event: Schema<"IssueEvent"> = {
    id: crypto.randomUUID(),
    at: currentTime().toISOString(),
    from_status: issue.status,
    to_status: input.to,
    actor_label: issue.opd.name,
    note: `${reason}${input.response}`,
    evidence,
  };
  store.events.set(id, [...(store.events.get(id) ?? []), event]);
  return { ok: true, value: { status: input.to, event } };
}

export async function setPublication(
  issueId: string,
  attachmentId: string,
  input: Publication,
): Promise<Outcome<AgencyAttachment>> {
  const issue = agencyIssues().find((item) => item.id === issueId);
  if (!issue) {
    return { ok: false, status: 404, message: "Isu tidak ditemukan." };
  }
  const reports = reportsOf(issue);
  const target = reports.flatMap((report) => report.attachments.map((attachment) => ({ attachment, visibility: report.visibility })))
    .find((entry) => entry.attachment.id === attachmentId);
  if (!target) {
    return { ok: false, status: 404, message: "Foto tidak ditemukan." };
  }
  if (target.visibility !== "PUBLIK") {
    return { ok: false, status: 409, message: "Foto dari laporan Rahasia tidak bisa ditampilkan di publik." };
  }
  const next: Publication = { public_ok: input.public_ok, is_cover: input.public_ok && input.is_cover };
  const store = agencyStore();
  if (next.is_cover) {
    for (const report of reports) {
      for (const attachment of report.attachments) {
        if (attachment.id !== attachmentId && attachment.is_cover) {
          store.publication.set(attachment.id, { public_ok: attachment.public_ok, is_cover: false });
        }
      }
    }
  }
  store.publication.set(attachmentId, next);
  return { ok: true, value: { ...target.attachment, ...next } };
}

function toMime(type: string): Schema<"Attachment">["mime"] | null {
  switch (type) {
    case "image/jpeg":
    case "image/png":
    case "image/webp":
      return type;
    default:
      return null;
  }
}

export async function saveEvidence(file: File): Promise<Outcome<Schema<"Attachment">>> {
  const problem = checkFile(file);
  const mime = toMime(file.type);
  if (problem || !mime) {
    return { ok: false, status: 422, message: problem ?? "Hanya foto JPEG, PNG, atau WebP." };
  }
  const id = crypto.randomUUID();
  const attachment: Schema<"Attachment"> = {
    id,
    url: `${EVIDENCE_PATH}/${id}`,
    mime,
    size_bytes: file.size,
  };
  agencyStore().evidence.set(id, { attachment, mime, bytes: await file.arrayBuffer() });
  return { ok: true, value: attachment };
}

export function readEvidence(id: string) {
  return agencyStore().evidence.get(id) ?? null;
}

function medianOf(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? (low + high) / 2 : high;
}

function responseHours(issue: Issue): number | null {
  const index = issue.timeline.findIndex((event) => event.to_status === "DITERUSKAN");
  const forwarded = issue.timeline[index];
  const next = issue.timeline[index + 1];
  if (!forwarded || !next || next.actor_label === "Sistem") {
    return null;
  }
  return (Date.parse(next.at) - Date.parse(forwarded.at)) / MS_PER_HOUR;
}

export async function getAgencyStats(): Promise<Schema<"AgencyStats">> {
  const issues = agencyIssues();
  const counts = new Map<Status, number>();
  for (const issue of issues) {
    counts.set(issue.status, (counts.get(issue.status) ?? 0) + 1);
  }
  const hours = issues.flatMap((issue) => responseHours(issue) ?? []);
  const withinSla = issues.filter((issue) => {
    const taken = responseHours(issue);
    return taken !== null && taken <= SLA_HOURS[issue.urgency];
  }).length;
  const overdue = issues.filter((issue) => {
    const due = slaDueAt(issue);
    return due !== null && Date.parse(due) < currentTime().getTime();
  }).length;
  const considered = hours.length + overdue;
  return {
    total_open: issues.filter((issue) => OPEN.includes(issue.status)).length,
    by_status: [...counts.entries()].map(([status, count]) => ({ status, count })),
    sla_compliance_percent: considered === 0 ? 100 : Math.round((withinSla / considered) * 100),
    median_response_hours: medianOf(hours),
  };
}
