import { paginate, type PageParams } from "@/lib/data/paging";
import { OPDS } from "@/lib/mock/reference";
import { drillItems, METHODOLOGY, SCORECARD } from "@/lib/mock/scorecard";
import type { Schema } from "@/lib/schema";

export interface IndicatorItemFilters extends PageParams {
  opd?: string | undefined;
}

export async function getScorecard(): Promise<Schema<"Scorecard">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/scorecard`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.period) {
        return data;
      }
    }
  } catch {}
  return SCORECARD;
}

export async function getMethodology(): Promise<Schema<"Methodology">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/methodology`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.indicators) {
        return data;
      }
    }
  } catch {}
  return METHODOLOGY;
}

export async function getIndicatorItems(
  code: Schema<"IndicatorCode">,
  filters: IndicatorItemFilters = {},
): Promise<Schema<"DrillList">> {
  const opdCode = OPDS.find((opd) => opd.ref.slug === filters.opd)?.ref.code;
  const unknownOpd = filters.opd !== undefined && opdCode === undefined;
  const items = unknownOpd ? [] : drillItems(code, opdCode);
  return { indicator: code, ...paginate(items, filters) };
}
