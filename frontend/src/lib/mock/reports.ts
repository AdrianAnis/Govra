import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { locationOf, VILLAGE_ID } from "@/lib/mock/reference";
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

const SEEDS: readonly SeedReport[] = [
  {
    code: "TLK-2610-A1B2",
    title: "Banjir lokal di jalan Kelurahan Dahlia",
    body: "Setiap hujan deras jalan di depan Pasar Dahlia tergenang setinggi lutut dan motor sulit lewat.",
    visibility: "PUBLIK",
    issueTitle: "Banjir lokal di jalan Kelurahan Dahlia",
    village: VILLAGE_ID.dahlia,
    created: "2026-10-22T02:10:00Z",
  },
  {
    code: "TLK-2610-C3D4",
    title: "Pagar sekolah roboh",
    body: "Pagar SDN Kenanga roboh sepanjang kurang lebih sepuluh meter dan anak-anak bermain di dekatnya.",
    visibility: "PUBLIK",
    issueTitle: "Pagar sekolah roboh di Desa Kenanga",
    village: VILLAGE_ID.kenanga,
    created: "2026-10-20T01:30:00Z",
  },
  {
    code: "TLK-2610-G7H8",
    title: null,
    body: "Saya ingin melaporkan dugaan pungutan liar di loket pelayanan. Mohon identitas saya dirahasiakan.",
    visibility: "RAHASIA",
    issueTitle: null,
    village: VILLAGE_ID.melati,
    created: "2026-10-23T08:00:00Z",
  },
  {
    code: "TLK-2609-E5F6",
    title: "Tempat sampah umum rusak",
    body: "Tempat sampah di taman Kelurahan Cempaka pecah dan sampahnya berserakan ke jalan.",
    visibility: "PUBLIK",
    issueTitle: "Tempat sampah umum rusak di Kelurahan Cempaka",
    village: VILLAGE_ID.cempaka,
    created: "2026-09-24T02:30:00Z",
  },
];

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
