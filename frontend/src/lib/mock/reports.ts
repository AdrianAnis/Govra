import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { locationOf } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

type Detail = Schema<"MyReportDetail">;
type Outcome = Schema<"FeedbackOutcome">;

interface ReportStore {
  created: Detail[];
  feedback: Map<string, Outcome>;
}

interface SeedReport {
  code: string;
  title: string | null;
  body: string;
  visibility: Schema<"Visibility">;
  issueTitle: string | null;
  village: string;
  created: string;
}

const STORE_KEY = Symbol.for("govra.report-store");
const FEEDBACK_WINDOW_DAYS = 5;
const MS_PER_DAY = 86_400_000;

const SEEDS: readonly SeedReport[] = [];

const VERIFYING: readonly Schema<"IssueStatus">[] = ["DIAJUKAN", "MENUNGGU_VERIFIKASI"];

function buildTimeline(createdAt: string): Schema<"IssueEvent">[] {
  return VERIFYING.map((status, step) => ({
    id: `0197d000-0000-7000-8000-${String(step + 1).padStart(12, "0")}`,
    at: new Date(Date.parse(createdAt) + step * 60_000).toISOString(),
    from_status: VERIFYING[step - 1] ?? null,
    to_status: status,
    actor_label: "Sistem",
    note: step === 0 ? null : "Menunggu verifikasi Admin.",
    evidence: [],
  }));
}

function fromSeed(seed: SeedReport): Detail {
  const issue = seed.issueTitle ? PUBLIC_ISSUES.find((item) => item.title === seed.issueTitle) : undefined;
  const timeline = issue ? issue.timeline : buildTimeline(seed.created);
  const last = timeline[timeline.length - 1];
  return {
    code: seed.code,
    title: seed.title,
    status: last ? last.to_status : "DIAJUKAN",
    visibility: seed.visibility,
    created_at: seed.created,
    issue_id: issue ? issue.id : null,
    body: seed.body,
    location: locationOf(seed.village),
    attachments: [],
    timeline,
    feedback: { can_submit: false, deadline: null, submitted: null },
    issue: issue ? toSummary(issue) : null,
  };
}

function isStore(value: unknown): value is ReportStore {
  return typeof value === "object" && value !== null && "created" in value && "feedback" in value;
}

export function reportStore(): ReportStore {
  const existing: unknown = Reflect.get(globalThis, STORE_KEY);
  if (isStore(existing)) {
    return existing;
  }
  const fresh: ReportStore = { created: [], feedback: new Map() };
  Reflect.set(globalThis, STORE_KEY, fresh);
  return fresh;
}

function withFeedback(report: Detail, now: Date): Detail {
  if (report.status !== "SELESAI") {
    return report;
  }
  const submitted = reportStore().feedback.get(report.code) ?? null;
  const deadline = new Date(now.getTime() + FEEDBACK_WINDOW_DAYS * MS_PER_DAY).toISOString();
  return { ...report, feedback: { can_submit: submitted === null, deadline, submitted } };
}

export function allReports(now: Date): Detail[] {
  const seeded = SEEDS.map(fromSeed);
  return [...reportStore().created, ...seeded]
    .map((report) => withFeedback(report, now))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
