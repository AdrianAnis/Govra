import { z } from "zod";
import type { ReportDraft } from "@/lib/report-draft";

const TURNSTILE_PLACEHOLDER = "pending-turnstile";

const errorSchema = z.object({ message: z.string() });
const createdSchema = z.object({ code: z.string() });
const supportSchema = z.object({ report_code: z.string(), reporter_count: z.number() });
const feedbackResultSchema = z.object({ issue_status: z.string() });

const suggestionSchema = z.object({
  issue: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    reporter_count: z.number(),
    location: z.object({
      village: z.object({ name: z.string() }),
      district: z.object({ name: z.string() }),
    }),
  }),
  distance_m: z.number(),
});

const suggestionListSchema = z.object({ items: z.array(suggestionSchema) });

export type Suggestion = z.infer<typeof suggestionSchema>;

const FALLBACK_MESSAGE = "Terjadi kendala. Coba lagi sebentar lagi.";

async function request<T>(url: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = errorSchema.safeParse(payload);
    throw new Error(failure.success ? failure.data.message : FALLBACK_MESSAGE);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(FALLBACK_MESSAGE);
  }
  return parsed.data;
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function submitReport(draft: ReportDraft) {
  const form = new FormData();
  form.set("title", draft.title);
  form.set("body", draft.body);
  form.set("village_id", draft.villageId);
  form.set("lat", String(draft.point?.lat ?? ""));
  form.set("lng", String(draft.point?.lng ?? ""));
  form.set("visibility", draft.visibility);
  form.set("turnstile_token", TURNSTILE_PLACEHOLDER);
  for (const item of draft.files) {
    form.append("attachments", item.file);
  }
  return request("/api/reports", { method: "POST", body: form }, createdSchema);
}

export async function fetchSuggestions(draft: ReportDraft): Promise<Suggestion[]> {
  if (!draft.point) {
    return [];
  }
  const result = await request(
    "/api/reports/duplicates",
    jsonInit({ body: draft.body.trim(), lat: draft.point.lat, lng: draft.point.lng }),
    suggestionListSchema,
  );
  return result.items;
}

export function supportIssue(issueId: string) {
  return request(`/api/issues/${issueId}/support`, { method: "POST" }, supportSchema);
}

export function sendFeedback(code: string, outcome: "CONFIRM" | "DISPUTE", note: string) {
  return request(`/api/me/reports/${code}/feedback`, jsonInit({ outcome, note }), feedbackResultSchema);
}
