import { z } from "zod";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const REVALIDATE_SECONDS = 60;

const indicatorSchema = z.object({
  code: z.string(),
  label: z.string(),
  unit: z.enum(["PERCENT", "HOURS"]),
  value: z.number().nullable(),
  sample_size: z.number(),
});

const monthlySchema = z.object({
  month: z.string(),
  issues_received: z.number(),
  issues_resolved: z.number(),
  avg_response_hours: z.number().nullable(),
  proker_active: z.number(),
  proker_completed: z.number(),
  proker_avg_progress: z.number().nullable(),
});

const analyticsSchema = z.object({
  opd: z.object({ code: z.string(), slug: z.string(), name: z.string() }),
  categories: z.array(z.string()),
  indicators: z.array(indicatorSchema),
  proker_total: z.number(),
  issues_total: z.number(),
  monthly: z.array(monthlySchema),
});

export type OpdAnalytics = z.infer<typeof analyticsSchema>;
export type OpdIndicator = z.infer<typeof indicatorSchema>;
export type OpdMonthly = z.infer<typeof monthlySchema>;

export async function getOpdAnalytics(slug: string): Promise<OpdAnalytics | null> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/opds/${encodeURIComponent(slug)}/analytics`, {
      headers: { "X-BFF-Key": BFF_KEY },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return null;
    }
    const parsed = analyticsSchema.safeParse(await res.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
