import "@/lib/zod-config";
import { z } from "zod";
import { jsonInit, request } from "@/lib/http";
import type { ReportDraft } from "@/lib/report-draft";

const TURNSTILE_PLACEHOLDER = "pending-turnstile";

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

export function submitReport(draft: ReportDraft) {
  const form = new FormData();
  form.set("title", draft.title);
  form.set("body", draft.body);
  form.set("district_id", draft.districtId);
  form.set("village_id", draft.villageId);
  form.set("address_detail", draft.addressDetail || "");
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

export interface ContentCheckResult {
  is_violation: boolean;
  violation_type: "SARA" | "PORNOGRAPHY" | "GIBBERISH" | "NONE" | string;
  confidence: number;
  reason?: string;
  topic?: string;
  estimated_opd?: string;
  suggested_title?: string;
}

export async function checkReportContent(text: string, title?: string): Promise<ContentCheckResult> {
  try {
    const res = await fetch("/api/reports/check-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, title }),
    });
    if (!res.ok) {
      return {
        is_violation: false,
        violation_type: "NONE",
        confidence: 0,
      };
    }
    return res.json();
  } catch {
    return {
      is_violation: false,
      violation_type: "NONE",
      confidence: 0,
    };
  }
}
