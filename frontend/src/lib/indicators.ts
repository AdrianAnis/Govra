import { formatIndicator } from "@/lib/format";
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

export function indicatorParts(indicator: Schema<"IndicatorValue">): { number: string; suffix: string } {
  if (indicator.value === null) {
    return { number: "–", suffix: "" };
  }
  const suffix = indicator.unit === "PERCENT" ? "%" : "jam";
  const number = formatIndicator(indicator.value, indicator.unit).replace(/\s?(%|jam)$/, "");
  return { number, suffix };
}

export function parseIndicatorSlug(slug: string): Code | null {
  return CODES.find((code) => indicatorSlug(code) === slug) ?? null;
}
