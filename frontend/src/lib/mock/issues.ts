import { categoryRef, locationOf, opdRef } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

type Status = Schema<"IssueStatus">;

interface IssueSeed {
  title: string;
  opd: string;
  category: string;
  village: string;
  status: Status;
  urgency: Schema<"Urgency">;
  reporters: number;
  created: string;
  response: number;
  finish: number;
  overdue: boolean;
}

const MS_PER_HOUR = 3_600_000;
const FORWARD_DELAY_HOURS = 0.003;
const REOPEN_DELAY_HOURS = 30;

const PATHS: Record<Status, Status[]> = {
  DIAJUKAN: ["DIAJUKAN"],
  MENUNGGU_VERIFIKASI: ["DIAJUKAN", "MENUNGGU_VERIFIKASI"],
  DITERUSKAN: ["DIAJUKAN", "DITERUSKAN"],
  DIPROSES: ["DIAJUKAN", "DITERUSKAN", "DIPROSES"],
  SELESAI: ["DIAJUKAN", "DITERUSKAN", "DIPROSES", "SELESAI"],
  DITOLAK: ["DIAJUKAN", "DITERUSKAN", "DITOLAK"],
  DIALIHKAN: ["DIAJUKAN", "DITERUSKAN", "DIALIHKAN"],
  DIBUKA_ULANG: ["DIAJUKAN", "DITERUSKAN", "DIPROSES", "SELESAI", "DIBUKA_ULANG"],
};

const SYSTEM_STATUSES: readonly Status[] = [
  "DIAJUKAN",
  "MENUNGGU_VERIFIKASI",
  "DITERUSKAN",
  "DIBUKA_ULANG",
];

const NOTES: Record<Status, (opd: string) => string | null> = {
  DIAJUKAN: () => null,
  MENUNGGU_VERIFIKASI: () => "Menunggu verifikasi Admin.",
  DITERUSKAN: (opd) => `Diteruskan ke ${opd}.`,
  DIPROSES: () => "Tim survei dikirim ke lokasi.",
  SELESAI: () => "Pekerjaan selesai dan lokasi sudah diperiksa ulang.",
  DITOLAK: () => "Laporan tidak termasuk kewenangan dinas ini.",
  DIALIHKAN: () => "Diajukan pengalihan ke dinas yang berwenang.",
  DIBUKA_ULANG: () => "Dibuka ulang karena sebagian warga menyanggah penyelesaian.",
};

const COVERS: Readonly<Record<string, string>> = {
  "Banjir lokal di jalan Kelurahan Dahlia": "/issues/banjir-hd.jpg",
  "Jembatan penghubung berderit di Desa Flamboyan": "/issues/jembatan-hd.jpg",
  "Pagar sekolah roboh di Desa Kenanga": "/issues/pagar-hd.jpg",
  "Atap ruang kelas SD bocor di Kelurahan Dahlia": "/issues/atap-hd.jpg",
};

function coverFor(title: string): Schema<"CoverPhoto"> | null {
  const url = COVERS[title];
  return url ? { url, mime: "image/jpeg" } : null;
}

const ISSUE_SEEDS: readonly IssueSeed[] = [];

function padId(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(12, "0")}`;
}

function offsetHours(status: Status, seed: IssueSeed): number {
  if (status === "DIAJUKAN") {
    return 0;
  }
  if (status === "SELESAI") {
    return seed.finish;
  }
  if (status === "DIBUKA_ULANG") {
    return seed.finish + REOPEN_DELAY_HOURS;
  }
  if (SYSTEM_STATUSES.includes(status)) {
    return FORWARD_DELAY_HOURS;
  }
  return seed.response;
}

function evidenceFor(status: Status, issueNumber: number): Schema<"Attachment">[] {
  if (status !== "SELESAI") {
    return [];
  }
  return [
    {
      id: padId("0197f000-0000-7000-8000", issueNumber),
      url: `https://example.org/bukti/isu-${issueNumber}.jpg`,
      mime: "image/jpeg",
      size_bytes: 184_320,
    },
  ];
}

function buildTimeline(seed: IssueSeed, issueNumber: number): Schema<"IssueEvent">[] {
  const createdMs = Date.parse(seed.created);
  const opdName = opdRef(seed.opd).name;
  const path = PATHS[seed.status];
  return path.map((status, step) => ({
    id: padId("0197e000-0000-7000-8000", issueNumber * 10 + step),
    at: new Date(createdMs + offsetHours(status, seed) * MS_PER_HOUR).toISOString(),
    from_status: path[step - 1] ?? null,
    to_status: status,
    actor_label: SYSTEM_STATUSES.includes(status) ? "Sistem" : opdName,
    note: NOTES[status](opdName),
    evidence: evidenceFor(status, issueNumber),
  }));
}

function buildIssue(seed: IssueSeed, index: number): Schema<"IssueDetail"> {
  const issueNumber = index + 1;
  const timeline = buildTimeline(seed, issueNumber);
  const lastEvent = timeline[timeline.length - 1];
  return {
    id: padId("0197b000-0000-7000-8000", issueNumber),
    title: seed.title,
    opd: opdRef(seed.opd),
    category: categoryRef(seed.category),
    status: seed.status,
    urgency: seed.urgency,
    reporter_count: seed.reporters,
    location: locationOf(seed.village),
    created_at: seed.created,
    updated_at: lastEvent ? lastEvent.at : seed.created,
    cover_photo: coverFor(seed.title),
    response_overdue: seed.overdue,
    timeline,
  };
}

const UNVERIFIED: readonly Status[] = ["DIAJUKAN", "MENUNGGU_VERIFIKASI"];

const ALL_ISSUES: Schema<"IssueDetail">[] = ISSUE_SEEDS.map(buildIssue);

export const PUBLIC_ISSUES: Schema<"IssueDetail">[] = ALL_ISSUES.filter(
  (issue) => !UNVERIFIED.includes(issue.status),
);

export const UNVERIFIED_ISSUES: Schema<"IssueDetail">[] = ALL_ISSUES.filter((issue) =>
  UNVERIFIED.includes(issue.status),
);

export function toSummary(issue: Schema<"IssueDetail">): Schema<"IssueSummary"> {
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
