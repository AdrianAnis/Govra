import { clampPercent } from "@/lib/format";
import { PUBLIC_ISSUES } from "@/lib/mock/issues";
import { DISTRICT_ID, districtRef, goalRef, opdRef } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

export const MOCK_TODAY = "2026-10-24";

const LATE_THRESHOLD = 10;
const TODAY_MS = Date.parse(MOCK_TODAY);

type Milestone = readonly [name: string, due: string, done: boolean];
type Update = readonly [date: string, note: string, progress: number];

interface ProgramSeed {
  code: string;
  name: string;
  opd: string;
  goal: string;
  district: string;
  start: string;
  end: string;
  progress: number;
  indicator: string;
  target: number;
  unit: string;
  realization: number;
  ceiling: number;
  realized: number;
  milestones: readonly Milestone[];
  updates: readonly Update[];
  documentation?: readonly (readonly [url: string, caption: string])[];
}

const PROGRAM_SEEDS: readonly ProgramSeed[] = [
  {
    code: "PRK-001", name: "Perbaikan jalan poros Kecamatan Utara", opd: "BMSDA", goal: "INFRA_JALAN", district: DISTRICT_ID.utara,
    start: "2026-01-05", end: "2026-12-20", progress: 40,
    indicator: "Panjang jalan yang diperbaiki", target: 12, unit: "km", realization: 4.8,
    ceiling: 4_500_000_000, realized: 1_800_000_000,
    milestones: [["Survei dan perencanaan", "2026-02-15", true], ["Lelang pekerjaan", "2026-04-30", true], ["Pengaspalan tahap 1", "2026-08-31", false], ["Pengaspalan tahap 2", "2026-12-15", false]],
    updates: [["2026-10-10", "Pengaspalan segmen kedua tertunda cuaca.", 40], ["2026-08-12", "Material tiba di lokasi.", 30]],
    documentation: [["https://example.org/dokumentasi/prk-001-1.jpg", "Pengaspalan segmen pertama"]],
  },
  {
    code: "PRK-002", name: "Pembangunan TPS 3R Kecamatan Selatan", opd: "LHK", goal: "LINGKUNGAN", district: DISTRICT_ID.selatan,
    start: "2026-03-01", end: "2026-11-30", progress: 82,
    indicator: "Unit TPS 3R terbangun", target: 3, unit: "unit", realization: 2,
    ceiling: 2_100_000_000, realized: 1_750_000_000,
    milestones: [["Survei lokasi", "2026-03-31", true], ["Pembangunan struktur", "2026-07-31", true], ["Pengadaan mesin pencacah", "2026-10-31", false], ["Uji coba operasi", "2026-11-25", false]],
    updates: [["2026-10-18", "Mesin pencacah dalam pengiriman.", 82], ["2026-09-02", "Struktur unit kedua selesai.", 70]],
  },
  {
    code: "PRK-003", name: "Pengadaan alat kesehatan puskesmas", opd: "KES", goal: "KESEHATAN", district: DISTRICT_ID.timur,
    start: "2026-02-01", end: "2026-09-30", progress: 70,
    indicator: "Paket alat kesehatan terkirim", target: 20, unit: "paket", realization: 14,
    ceiling: 3_200_000_000, realized: 2_600_000_000,
    milestones: [["Penetapan spesifikasi", "2026-03-15", true], ["Proses pengadaan", "2026-06-30", true], ["Pengiriman seluruh paket", "2026-09-30", false]],
    updates: [["2026-10-05", "Enam paket tertahan di pemasok.", 70], ["2026-08-20", "Delapan paket pertama diterima.", 45]],
  },
  {
    code: "PRK-004", name: "Normalisasi saluran drainase Kecamatan Utara", opd: "BMSDA", goal: "INFRA_JALAN", district: DISTRICT_ID.utara,
    start: "2026-11-15", end: "2027-06-30", progress: 0,
    indicator: "Panjang saluran dinormalisasi", target: 5, unit: "km", realization: 0,
    ceiling: 2_800_000_000, realized: 0,
    milestones: [["Perencanaan teknis", "2026-12-15", false], ["Lelang pekerjaan", "2027-02-28", false], ["Pekerjaan lapangan", "2027-06-15", false]],
    updates: [],
  },
  {
    code: "PRK-005", name: "Rehabilitasi ruang kelas sekolah dasar", opd: "DIKBUD", goal: "PENDIDIKAN", district: DISTRICT_ID.barat,
    start: "2026-01-15", end: "2026-08-31", progress: 100,
    indicator: "Ruang kelas direhabilitasi", target: 18, unit: "ruang", realization: 18,
    ceiling: 1_900_000_000, realized: 1_850_000_000,
    milestones: [["Verifikasi kondisi bangunan", "2026-02-28", true], ["Pelaksanaan rehabilitasi", "2026-07-31", true], ["Serah terima pekerjaan", "2026-08-31", true]],
    updates: [["2026-08-29", "Seluruh ruang kelas diserahterimakan.", 100], ["2026-06-10", "Dua belas ruang kelas selesai.", 67]],
    documentation: [["https://example.org/dokumentasi/prk-005-1.jpg", "Ruang kelas setelah rehabilitasi"]],
  },
  {
    code: "PRK-006", name: "Pelebaran jalan penghubung Kecamatan Timur", opd: "BMSDA", goal: "INFRA_JALAN", district: DISTRICT_ID.timur,
    start: "2026-04-01", end: "2027-03-31", progress: 35,
    indicator: "Panjang jalan dilebarkan", target: 8, unit: "km", realization: 2.8,
    ceiling: 6_200_000_000, realized: 2_100_000_000,
    milestones: [["Pembebasan lahan", "2026-06-30", true], ["Pekerjaan tahap 1", "2026-11-30", false], ["Pekerjaan tahap 2", "2027-03-15", false]],
    updates: [["2026-10-12", "Pembebasan dua bidang lahan masih berjalan.", 35]],
  },
  {
    code: "PRK-007", name: "Pemasangan lampu lalu lintas perempatan utama", opd: "PERHUB", goal: "INFRA_JALAN", district: DISTRICT_ID.timur,
    start: "2026-05-01", end: "2026-12-31", progress: 66,
    indicator: "Titik lampu lalu lintas terpasang", target: 6, unit: "titik", realization: 4,
    ceiling: 1_200_000_000, realized: 800_000_000,
    milestones: [["Survei titik", "2026-05-31", true], ["Pemasangan titik 1 sampai 4", "2026-09-30", true], ["Pemasangan titik 5 dan 6", "2026-12-15", false]],
    updates: [["2026-10-15", "Empat titik menyala dan sudah diuji.", 66]],
  },
  {
    code: "PRK-008", name: "Pengadaan bus sekolah", opd: "PERHUB", goal: "PENDIDIKAN", district: DISTRICT_ID.barat,
    start: "2026-06-01", end: "2027-01-31", progress: 60,
    indicator: "Unit bus sekolah diterima", target: 5, unit: "unit", realization: 3,
    ceiling: 3_750_000_000, realized: 2_250_000_000,
    milestones: [["Kontrak pengadaan", "2026-07-15", true], ["Pengiriman tahap 1", "2026-10-15", true], ["Pengiriman tahap 2", "2027-01-15", false]],
    updates: [["2026-10-16", "Tiga unit bus diterima dan diregistrasi.", 60]],
  },
  {
    code: "PRK-009", name: "Revitalisasi puskesmas pembantu", opd: "KES", goal: "KESEHATAN", district: DISTRICT_ID.selatan,
    start: "2026-03-15", end: "2026-10-15", progress: 90,
    indicator: "Puskesmas pembantu direvitalisasi", target: 10, unit: "unit", realization: 9,
    ceiling: 3_500_000_000, realized: 3_100_000_000,
    milestones: [["Perencanaan", "2026-04-15", true], ["Pekerjaan fisik", "2026-09-30", true], ["Pemeriksaan akhir", "2026-10-15", false]],
    updates: [["2026-10-14", "Satu unit tersisa menunggu instalasi listrik.", 90]],
  },
  {
    code: "PRK-010", name: "Penataan taman kota dan ruang hijau", opd: "LHK", goal: "LINGKUNGAN", district: DISTRICT_ID.utara,
    start: "2026-02-10", end: "2026-10-10", progress: 100,
    indicator: "Luas ruang hijau ditata", target: 4, unit: "hektare", realization: 4,
    ceiling: 1_400_000_000, realized: 1_380_000_000,
    milestones: [["Desain taman", "2026-03-10", true], ["Penanaman dan penataan", "2026-09-15", true], ["Serah terima", "2026-10-10", true]],
    updates: [["2026-10-09", "Taman diresmikan dan dibuka untuk umum.", 100]],
  },
  {
    code: "PRK-011", name: "Pembangunan jembatan desa", opd: "BMSDA", goal: "INFRA_JALAN", district: DISTRICT_ID.barat,
    start: "2026-07-01", end: "2027-05-31", progress: 30,
    indicator: "Jembatan desa terbangun", target: 3, unit: "unit", realization: 1,
    ceiling: 5_500_000_000, realized: 1_200_000_000,
    milestones: [["Perencanaan dan izin", "2026-09-30", true], ["Pembangunan jembatan 1", "2026-12-31", false], ["Pembangunan jembatan 2 dan 3", "2027-05-15", false]],
    updates: [["2026-10-08", "Pondasi jembatan pertama selesai.", 30]],
  },
  {
    code: "PRK-012", name: "Program bank sampah kelurahan", opd: "LHK", goal: "LINGKUNGAN", district: DISTRICT_ID.selatan,
    start: "2026-09-01", end: "2027-02-28", progress: 20,
    indicator: "Bank sampah aktif", target: 15, unit: "kelurahan", realization: 3,
    ceiling: 900_000_000, realized: 200_000_000,
    milestones: [["Sosialisasi", "2026-10-15", true], ["Pelatihan pengelola", "2026-12-15", false], ["Operasional penuh", "2027-02-15", false]],
    updates: [["2026-10-20", "Tiga bank sampah mulai menerima setoran warga.", 20]],
  },
];

function expectedPercent(start: string, end: string): number {
  const span = Date.parse(end) - Date.parse(start);
  return Math.round(clampPercent(((TODAY_MS - Date.parse(start)) / span) * 100));
}

function statusOf(seed: ProgramSeed, expected: number): Schema<"ProgramStatus"> {
  if (seed.progress >= 100) {
    return "SELESAI";
  }
  if (TODAY_MS < Date.parse(seed.start)) {
    return "BELUM_DIMULAI";
  }
  if (TODAY_MS > Date.parse(seed.end)) {
    return "MELEWATI_TENGGAT";
  }
  return seed.progress >= expected - LATE_THRESHOLD ? "SESUAI_JADWAL" : "TERLAMBAT";
}

function relatedIssueCount(opd: string, district: string): number {
  return PUBLIC_ISSUES.filter(
    (issue) => issue.opd.code === opd && issue.location.district.id === district,
  ).length;
}

function buildProgram(seed: ProgramSeed): Schema<"ProgramDetail"> {
  const expected = expectedPercent(seed.start, seed.end);
  return {
    code: seed.code,
    name: seed.name,
    opd: opdRef(seed.opd),
    goal: goalRef(seed.goal),
    district: districtRef(seed.district),
    status: statusOf(seed, expected),
    progress_percent: seed.progress,
    expected_percent: expected,
    start_date: seed.start,
    end_date: seed.end,
    related_issue_count: relatedIssueCount(seed.opd, seed.district),
    indicator: seed.indicator,
    target: seed.target,
    unit: seed.unit,
    realization: seed.realization,
    budget: { ceiling: seed.ceiling, realized: seed.realized },
    milestones: seed.milestones.map(([name, due_date, done]) => ({ name, due_date, done })),
    documentation: (seed.documentation ?? []).map(([url, caption]) => ({ url, caption })),
    updates: seed.updates.map(([date, note, progress_percent]) => ({ date, note, progress_percent })),
  };
}

export const PROGRAM_DETAILS: Schema<"ProgramDetail">[] = PROGRAM_SEEDS.map(buildProgram);
