import { paginate, type PageParams } from "@/lib/data/paging";
import { OPDS } from "@/lib/mock/reference";
import { drillItems, METHODOLOGY, SCORECARD } from "@/lib/mock/scorecard";
import type { Schema } from "@/lib/schema";

export interface IndicatorItemFilters extends PageParams {
  opd?: string | undefined;
}

export async function getScorecard(): Promise<Schema<"Scorecard">> {
  return SCORECARD;
}

export async function getMethodology(): Promise<Schema<"Methodology">> {
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
