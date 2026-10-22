import type { components } from "@/types/api";

type ProgramSummary = components["schemas"]["ProgramSummary"];
type IssueSummary = components["schemas"]["IssueSummary"];
type IssueEvent = components["schemas"]["IssueEvent"];

export const NOW = new Date("2026-10-23T10:00:00+07:00");

const OPD = { code: "BMSDA", slug: "bina-marga-sda", name: "Bina Marga dan SDA" };
const GOAL = { code: "S1", name: "Infrastruktur yang merata" };
const DISTRICT = { id: "11111111-1111-4111-8111-111111111111", name: "Kecamatan Satu" };

export const PROGRAMS: ProgramSummary[] = [
  {
    code: "PRK-001",
    name: "Perbaikan jalan lingkungan Kecamatan Satu",
    opd: OPD,
    goal: GOAL,
    district: DISTRICT,
    status: "TERLAMBAT",
    progress_percent: 40,
    expected_percent: 62,
    start_date: "2026-01-05",
    end_date: "2026-12-20",
    related_issue_count: 12,
  },
  {
    code: "PRK-002",
    name: "Normalisasi saluran drainase utama",
    opd: OPD,
    goal: GOAL,
    district: DISTRICT,
    status: "SELESAI",
    progress_percent: 100,
    expected_percent: 100,
    start_date: "2026-02-01",
    end_date: "2026-09-30",
    related_issue_count: 3,
  },
];

const VILLAGE = { id: "22222222-2222-4222-8222-222222222222", name: "Kelurahan Contoh" };

const ISSUE_BASE: IssueSummary = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Jalan berlubang di depan pasar",
  opd: OPD,
  category: { code: "JALAN", name: "Jalan" },
  status: "DIPROSES",
  urgency: "URGENT",
  reporter_count: 18,
  location: { village: VILLAGE, district: DISTRICT, point: { lat: -7.45, lng: 112.7 } },
  created_at: "2026-10-18T08:00:00+07:00",
  updated_at: "2026-10-22T14:05:00+07:00",
  response_overdue: true,
};

export const ISSUES: IssueSummary[] = [
  ISSUE_BASE,
  {
    ...ISSUE_BASE,
    id: "44444444-4444-4444-8444-444444444444",
    title: "Lampu jalan padam di gang sempit",
    status: "DITERUSKAN",
    urgency: "TINGGI",
    reporter_count: 4,
    response_overdue: false,
  },
  {
    ...ISSUE_BASE,
    id: "55555555-5555-4555-8555-555555555555",
    title: "Saluran air tersumbat sampah",
    status: "SELESAI",
    urgency: "NORMAL",
    reporter_count: 1,
    response_overdue: false,
  },
];

export const EVENTS: IssueEvent[] = [
  {
    id: "66666666-6666-4666-8666-666666666661",
    at: "2026-10-18T08:00:00+07:00",
    from_status: null,
    to_status: "DIAJUKAN",
    actor_label: "Sistem",
    note: null,
    evidence: [],
  },
  {
    id: "66666666-6666-4666-8666-666666666662",
    at: "2026-10-20T09:30:00+07:00",
    from_status: "DIAJUKAN",
    to_status: "DITERUSKAN",
    actor_label: "Admin",
    note: "Diteruskan ke Bina Marga dan SDA.",
    evidence: [],
  },
  {
    id: "66666666-6666-4666-8666-666666666663",
    at: "2026-10-22T14:05:00+07:00",
    from_status: "DITERUSKAN",
    to_status: "DIPROSES",
    actor_label: "Bina Marga dan SDA",
    note: "Tim survei sudah ke lokasi.",
    evidence: [
      {
        id: "77777777-7777-4777-8777-777777777777",
        url: "https://example.com/bukti-1.jpg",
        mime: "image/jpeg",
        size_bytes: 120000,
      },
    ],
  },
];
