import { z } from "zod";
import type { Schema } from "@/lib/schema";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_QUERY_LENGTH = 100;

const text = z
  .string()
  .trim()
  .max(MAX_QUERY_LENGTH)
  .catch("")
  .transform((value) => (value === "" ? undefined : value));

const page = z.coerce.number().int().min(1).catch(1);

const programStatus = z
  .enum(["BELUM_DIMULAI", "SESUAI_JADWAL", "TERLAMBAT", "MELEWATI_TENGGAT", "SELESAI"] satisfies Schema<"ProgramStatus">[])
  .optional()
  .catch(undefined);

const programFilters = z.object({
  q: text,
  opd: text,
  district_id: text,
  goal: text,
  status: programStatus,
  page,
});

const drillFilters = z.object({ opd: text, page });

const issueStatus = z
  .enum([
    "DIAJUKAN",
    "MENUNGGU_VERIFIKASI",
    "DITERUSKAN",
    "DIPROSES",
    "SELESAI",
    "DITOLAK",
    "DIALIHKAN",
    "DIBUKA_ULANG",
  ] satisfies Schema<"IssueStatus">[])
  .optional()
  .catch(undefined);

const urgency = z
  .enum(["NORMAL", "TINGGI", "URGENT"] satisfies Schema<"Urgency">[])
  .optional()
  .catch(undefined);

const issueFilters = z.object({
  q: text,
  opd: text,
  district_id: text,
  status: issueStatus,
  urgency,
  page,
});

const issueView = z.enum(["daftar", "peta"]).catch("daftar");

function firstValues(raw: RawSearchParams): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

export function parseProgramFilters(raw: RawSearchParams) {
  return programFilters.parse(firstValues(raw));
}

export function parseDrillFilters(raw: RawSearchParams) {
  return drillFilters.parse(firstValues(raw));
}

export function parseIssueFilters(raw: RawSearchParams) {
  return issueFilters.parse(firstValues(raw));
}

export function parseIssueView(raw: RawSearchParams) {
  return issueView.parse(firstValues(raw).tampil);
}
