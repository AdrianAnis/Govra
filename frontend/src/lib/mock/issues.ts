import { categoryRef, locationOf, opdRef, VILLAGE_ID } from "@/lib/mock/reference";
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

const ISSUE_SEEDS: readonly IssueSeed[] = [
  { title: "Jalan berlubang di Jalan Melati membahayakan pengendara", opd: "BMSDA", category: "JALAN_RUSAK", village: VILLAGE_ID.melati, status: "DIPROSES", urgency: "URGENT", reporters: 12, created: "2026-10-15T01:10:00Z", response: 27, finish: 0, overdue: false },
  { title: "Tumpukan sampah di pinggir jalan Kelurahan Anggrek", opd: "LHK", category: "SAMPAH", village: VILLAGE_ID.anggrek, status: "SELESAI", urgency: "NORMAL", reporters: 2, created: "2026-10-02T03:00:00Z", response: 18, finish: 160, overdue: false },
  { title: "Lampu lalu lintas mati di perempatan Desa Mawar", opd: "PERHUB", category: "LAMPU_LALIN", village: VILLAGE_ID.mawar, status: "DITERUSKAN", urgency: "TINGGI", reporters: 6, created: "2026-10-12T02:00:00Z", response: 0, finish: 0, overdue: true },
  { title: "Genangan air tidak surut di Desa Kenanga setiap hujan", opd: "BMSDA", category: "DRAINASE", village: VILLAGE_ID.kenanga, status: "DIPROSES", urgency: "TINGGI", reporters: 8, created: "2026-10-08T05:00:00Z", response: 40, finish: 0, overdue: false },
  { title: "Atap ruang kelas SD bocor di Kelurahan Dahlia", opd: "DIKBUD", category: "SEKOLAH_RUSAK", village: VILLAGE_ID.dahlia, status: "DITERUSKAN", urgency: "NORMAL", reporters: 3, created: "2026-10-19T03:20:00Z", response: 0, finish: 0, overdue: false },
  { title: "Pelayanan loket puskesmas Desa Teratai terlalu lama", opd: "KES", category: "PUSKESMAS", village: VILLAGE_ID.teratai, status: "DIPROSES", urgency: "NORMAL", reporters: 5, created: "2026-10-05T04:00:00Z", response: 52, finish: 0, overdue: false },
  { title: "Sampah tidak diangkut dua minggu di Desa Flamboyan", opd: "LHK", category: "SAMPAH", village: VILLAGE_ID.flamboyan, status: "DIPROSES", urgency: "TINGGI", reporters: 9, created: "2026-10-03T02:30:00Z", response: 30, finish: 0, overdue: false },
  { title: "Saluran drainase tersumbat di Kelurahan Cempaka", opd: "BMSDA", category: "DRAINASE", village: VILLAGE_ID.cempaka, status: "SELESAI", urgency: "NORMAL", reporters: 4, created: "2026-09-25T06:00:00Z", response: 22, finish: 120, overdue: false },
  { title: "Jalan retak dan ambles dekat jembatan Desa Flamboyan", opd: "BMSDA", category: "JALAN_RUSAK", village: VILLAGE_ID.flamboyan, status: "DIALIHKAN", urgency: "NORMAL", reporters: 2, created: "2026-10-01T07:00:00Z", response: 36, finish: 0, overdue: false },
  { title: "Puskesmas Kelurahan Cempaka kehabisan obat dasar", opd: "KES", category: "PUSKESMAS", village: VILLAGE_ID.cempaka, status: "SELESAI", urgency: "TINGGI", reporters: 11, created: "2026-09-22T03:00:00Z", response: 20, finish: 96, overdue: false },
  { title: "Lampu lalu lintas berkedip terus di Kelurahan Dahlia", opd: "PERHUB", category: "LAMPU_LALIN", village: VILLAGE_ID.dahlia, status: "DITOLAK", urgency: "NORMAL", reporters: 1, created: "2026-10-10T08:00:00Z", response: 48, finish: 0, overdue: false },
  { title: "Pagar sekolah roboh di Desa Kenanga", opd: "DIKBUD", category: "SEKOLAH_RUSAK", village: VILLAGE_ID.kenanga, status: "DIPROSES", urgency: "URGENT", reporters: 14, created: "2026-10-20T01:00:00Z", response: 8, finish: 0, overdue: false },
  { title: "Tumpukan sampah di saluran air Kelurahan Melati", opd: "LHK", category: "SAMPAH", village: VILLAGE_ID.melati, status: "DIBUKA_ULANG", urgency: "TINGGI", reporters: 7, created: "2026-09-28T04:00:00Z", response: 24, finish: 72, overdue: false },
  { title: "Lubang besar di jalan utama Desa Mawar", opd: "BMSDA", category: "JALAN_RUSAK", village: VILLAGE_ID.mawar, status: "DIAJUKAN", urgency: "NORMAL", reporters: 1, created: "2026-10-23T09:00:00Z", response: 0, finish: 0, overdue: false },
  { title: "Papan nama puskesmas Kelurahan Anggrek rusak", opd: "KES", category: "PUSKESMAS", village: VILLAGE_ID.anggrek, status: "MENUNGGU_VERIFIKASI", urgency: "NORMAL", reporters: 1, created: "2026-10-22T14:00:00Z", response: 0, finish: 0, overdue: false },
  { title: "Banjir lokal di jalan Kelurahan Dahlia", opd: "BMSDA", category: "DRAINASE", village: VILLAGE_ID.dahlia, status: "DITERUSKAN", urgency: "URGENT", reporters: 10, created: "2026-10-22T02:00:00Z", response: 0, finish: 0, overdue: true },
  { title: "Ruang kelas kekurangan meja di Desa Teratai", opd: "DIKBUD", category: "SEKOLAH_RUSAK", village: VILLAGE_ID.teratai, status: "SELESAI", urgency: "NORMAL", reporters: 3, created: "2026-09-21T03:00:00Z", response: 30, finish: 200, overdue: false },
  { title: "Lampu jalan padam di Desa Kenanga", opd: "PERHUB", category: "LAMPU_LALIN", village: VILLAGE_ID.kenanga, status: "DIPROSES", urgency: "TINGGI", reporters: 5, created: "2026-10-14T05:30:00Z", response: 60, finish: 0, overdue: false },
  { title: "Tempat sampah umum rusak di Kelurahan Cempaka", opd: "LHK", category: "SAMPAH", village: VILLAGE_ID.cempaka, status: "SELESAI", urgency: "NORMAL", reporters: 2, created: "2026-09-24T02:00:00Z", response: 15, finish: 50, overdue: false },
  { title: "Jembatan penghubung berderit di Desa Flamboyan", opd: "BMSDA", category: "JALAN_RUSAK", village: VILLAGE_ID.flamboyan, status: "DITERUSKAN", urgency: "TINGGI", reporters: 4, created: "2026-10-21T03:00:00Z", response: 0, finish: 0, overdue: false },
];

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
