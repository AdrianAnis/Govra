import { PUBLIC_ISSUES } from "@/lib/mock/issues";
import { MOCK_TODAY, PROGRAM_DETAILS } from "@/lib/mock/programs";
import { OPDS, REGION } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

type Code = Schema<"IndicatorCode">;
type Program = Schema<"ProgramDetail">;
type Issue = Schema<"IssueDetail">;
type Measure = { value: number | null; sample: number };

const TODAY_MS = Date.parse(MOCK_TODAY);
const MS_PER_HOUR = 3_600_000;
const rupiah = new Intl.NumberFormat("id-ID");

const CODES: readonly Code[] = [
  "KETUNTASAN_PROKER",
  "KETEPATAN_JADWAL",
  "RESPONSIVITAS",
  "PENYELESAIAN_ISU",
  "PENYERAPAN_ANGGARAN",
];

const INDICATORS: Record<
  Code,
  { label: string; unit: Schema<"IndicatorUnit">; formula: string; description: string }
> = {
  KETUNTASAN_PROKER: {
    label: "Ketuntasan proker",
    unit: "PERCENT",
    formula: "proker Selesai dibagi proker yang tenggatnya sudah lewat",
    description: "Seberapa banyak proker yang sudah jatuh tempo benar-benar selesai.",
  },
  KETEPATAN_JADWAL: {
    label: "Ketepatan jadwal",
    unit: "PERCENT",
    formula: "(Sesuai Jadwal ditambah Selesai) dibagi proker yang sudah dimulai",
    description: "Seberapa banyak proker yang berjalan sesuai jadwal.",
  },
  RESPONSIVITAS: {
    label: "Responsivitas",
    unit: "HOURS",
    formula: "median waktu dari isu Diteruskan sampai tanggapan pertama Dinas",
    description: "Seberapa cepat Dinas menanggapi isu warga, dalam jam.",
  },
  PENYELESAIAN_ISU: {
    label: "Penyelesaian isu",
    unit: "PERCENT",
    formula: "isu Selesai yang dikonfirmasi warga dibagi isu yang ditutup",
    description: "Seberapa banyak isu yang benar-benar dirasakan selesai oleh warga.",
  },
  PENYERAPAN_ANGGARAN: {
    label: "Penyerapan anggaran",
    unit: "PERCENT",
    formula: "realisasi dibagi pagu, per OPD",
    description: "Seberapa besar anggaran yang sudah terealisasi.",
  },
};

const THRESHOLDS: Schema<"Setting">[] = [
  { key: "PROGRAM_LATE_THRESHOLD", label: "Selisih progres untuk status Dalam Percepatan", value: 10, unit: "POINTS" },
  { key: "SLA_URGENT_HOURS", label: "Batas tanggapan pertama isu Urgent", value: 24, unit: "HOURS" },
  { key: "SLA_HIGH_DAYS", label: "Batas tanggapan pertama isu Tinggi", value: 3, unit: "DAYS" },
  { key: "SLA_NORMAL_BUSINESS_DAYS", label: "Batas tanggapan pertama isu Normal", value: 5, unit: "DAYS" },
];

const round1 = (value: number) => Math.round(value * 10) / 10;

function ratio(part: number, whole: number): Measure {
  return { value: whole === 0 ? null : round1((part / whole) * 100), sample: whole };
}

function median(values: number[]): number | null {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const high = sorted[middle];
  const low = sorted[middle - 1];
  if (high === undefined) {
    return null;
  }
  return round1(sorted.length % 2 === 0 && low !== undefined ? (low + high) / 2 : high);
}

const isDue = (program: Program) => Date.parse(program.end_date) < TODAY_MS;
const isStarted = (program: Program) => Date.parse(program.start_date) <= TODAY_MS;
const isClosed = (issue: Issue) => issue.status === "SELESAI" || issue.status === "DITOLAK";

function firstResponseHours(issue: Issue): number | null {
  const index = issue.timeline.findIndex((event) => event.to_status === "DITERUSKAN");
  const forwarded = issue.timeline[index];
  const next = issue.timeline[index + 1];
  if (!forwarded || !next || next.actor_label === "Sistem") {
    return null;
  }
  return (Date.parse(next.at) - Date.parse(forwarded.at)) / MS_PER_HOUR;
}

function scope(opd: string | undefined) {
  return {
    programs: PROGRAM_DETAILS.filter((program) => !opd || program.opd.code === opd),
    issues: PUBLIC_ISSUES.filter((issue) => !opd || issue.opd.code === opd),
  };
}

function measure(code: Code, opd: string | undefined): Measure {
  const { programs, issues } = scope(opd);
  const due = programs.filter(isDue);
  const started = programs.filter(isStarted);
  const hours = issues.flatMap((issue) => firstResponseHours(issue) ?? []);
  const closed = issues.filter(isClosed);
  const ceiling = programs.reduce((sum, program) => sum + program.budget.ceiling, 0);
  const realized = programs.reduce((sum, program) => sum + program.budget.realized, 0);
  switch (code) {
    case "KETUNTASAN_PROKER":
      return ratio(due.filter((program) => program.status === "SELESAI").length, due.length);
    case "KETEPATAN_JADWAL":
      return ratio(
        started.filter((p) => p.status === "SESUAI_JADWAL" || p.status === "SELESAI").length,
        started.length,
      );
    case "RESPONSIVITAS":
      return { value: median(hours), sample: hours.length };
    case "PENYELESAIAN_ISU":
      return ratio(closed.filter((issue) => issue.status === "SELESAI").length, closed.length);
    case "PENYERAPAN_ANGGARAN":
      return { value: ceiling === 0 ? null : round1((realized / ceiling) * 100), sample: programs.length };
  }
}

function indicatorsFor(opd: string | undefined): Schema<"IndicatorValue">[] {
  return CODES.map((code) => {
    const { value, sample } = measure(code, opd);
    const { label, unit } = INDICATORS[code];
    return { code, label, unit, value, sample_size: sample };
  });
}

export const SCORECARD: Schema<"Scorecard"> = {
  period: REGION.period,
  head_label: REGION.head_label,
  is_simulation: REGION.is_simulation,
  indicators: indicatorsFor(undefined),
  by_opd: OPDS.map(({ ref }) => ({ opd: ref, indicators: indicatorsFor(ref.code) })),
};

export const METHODOLOGY: Schema<"Methodology"> = {
  indicators: CODES.map((code) => {
    const { label, formula, description } = INDICATORS[code];
    return { code, label, formula, description };
  }),
  thresholds: THRESHOLDS,
};

function programItem(program: Program, counted: boolean, note: string): Schema<"DrillItem"> {
  return { kind: "PROGRAM", ref: program.code, title: program.name, opd: program.opd, counted, note };
}

function issueItem(issue: Issue, counted: boolean, note: string): Schema<"DrillItem"> {
  return { kind: "ISSUE", ref: issue.id, title: issue.title, opd: issue.opd, counted, note };
}

function describeBudget(program: Program): string {
  const { ceiling, realized } = program.budget;
  return `Realisasi Rp ${rupiah.format(realized)} dari pagu Rp ${rupiah.format(ceiling)}.`;
}

function describeResponse(issue: Issue): [boolean, string] {
  const hours = firstResponseHours(issue);
  return hours === null
    ? [false, "Belum ada tanggapan pertama dari Dinas."]
    : [true, `Ditanggapi dalam ${round1(hours)} jam.`];
}

export function drillItems(code: Code, opd: string | undefined): Schema<"DrillItem">[] {
  const { programs, issues } = scope(opd);
  switch (code) {
    case "KETUNTASAN_PROKER":
      return programs.filter(isDue).map((program) =>
        programItem(
          program,
          true,
          program.status === "SELESAI"
            ? "Target tercapai, progres 100 persen."
            : `Progres ${program.progress_percent} persen.`,
        ),
      );
    case "KETEPATAN_JADWAL":
      return programs
        .filter(isStarted)
        .map((p) =>
          programItem(p, true, `Progres ${p.progress_percent} persen.`),
        );
    case "RESPONSIVITAS":
      return issues
        .filter((issue) => issue.timeline.some((event) => event.to_status === "DITERUSKAN"))
        .map((issue) => issueItem(issue, ...describeResponse(issue)));
    case "PENYELESAIAN_ISU":
      return issues
        .filter(isClosed)
        .map((issue) =>
          issueItem(
            issue,
            true,
            issue.status === "SELESAI" ? "Penyelesaian dikonfirmasi warga." : "Ditolak oleh Dinas.",
          ),
        );
    case "PENYERAPAN_ANGGARAN":
      return programs.map((program) => programItem(program, true, describeBudget(program)));
  }
}
