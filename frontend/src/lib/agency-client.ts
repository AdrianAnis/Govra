import { z } from "zod";
import type { TransitionInput } from "@/lib/agency";
import { jsonInit, request } from "@/lib/http";

const transitionResultSchema = z.object({ status: z.string() });
const evidenceSchema = z.object({ id: z.string(), url: z.string() });
const publicationSchema = z.object({ public_ok: z.boolean(), is_cover: z.boolean() });

export function submitTransition(issueId: string, input: TransitionInput) {
  return request(`/api/agency/issues/${issueId}/transitions`, jsonInit(input), transitionResultSchema);
}

export function uploadEvidence(issueId: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  return request(`/api/agency/issues/${issueId}/evidence`, { method: "POST", body: form }, evidenceSchema);
}

export function updatePublication(
  issueId: string,
  attachmentId: string,
  state: { public_ok: boolean; is_cover: boolean },
) {
  return request(
    `/api/agency/issues/${issueId}/attachments/${attachmentId}/publication`,
    { ...jsonInit(state), method: "PUT" },
    publicationSchema,
  );
}
