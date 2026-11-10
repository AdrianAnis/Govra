import { paginate, type PageParams } from "@/lib/data/paging";
import { OPDS } from "@/lib/mock/reference";
import { drillItems, METHODOLOGY, SCORECARD } from "@/lib/mock/scorecard";
import type { Schema } from "@/lib/schema";

interface IndicatorItemFilters extends PageParams {
  opd?: string | undefined;
}

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function getScorecard(): Promise<Schema<"Scorecard">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/scorecard`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.period && typeof data.period === "object" && Array.isArray(data.by_opd)) {
        return data;
      }
    }
  } catch {}
  return SCORECARD;
}

export async function getMethodology(): Promise<Schema<"Methodology">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/methodology`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 3600 },
    });
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
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  const query = new URLSearchParams();
  if (filters.opd) query.set("opd", filters.opd);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.limit) query.set("limit", String(filters.limit));
  try {
    const res = await fetch(`${apiBase}/scorecard/indicators/${code}/items?${query.toString()}`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && typeof data.total === "number") {
        return data;
      }
    }
  } catch {}
  const opdCode = OPDS.find((opd) => opd.ref.slug === filters.opd)?.ref.code;
  const unknownOpd = filters.opd !== undefined && opdCode === undefined;
  const items = unknownOpd ? [] : drillItems(code, opdCode);
  return { indicator: code, ...paginate(items, filters) };
}
