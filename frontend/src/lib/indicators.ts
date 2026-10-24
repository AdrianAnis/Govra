import type { Schema } from "@/lib/schema";

type Code = Schema<"IndicatorCode">;

const CODES: readonly Code[] = [
  "KETUNTASAN_PROKER",
  "KETEPATAN_JADWAL",
  "RESPONSIVITAS",
  "PENYELESAIAN_ISU",
  "PENYERAPAN_ANGGARAN",
];

export function indicatorSlug(code: Code): string {
  return code.toLowerCase().replaceAll("_", "-");
}

export function parseIndicatorSlug(slug: string): Code | null {
  return CODES.find((code) => indicatorSlug(code) === slug) ?? null;
}
