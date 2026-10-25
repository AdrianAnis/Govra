import { errorResponse } from "@/lib/api-response";
import { staffGuard } from "@/lib/auth-route";
import { saveEvidence } from "@/lib/data/agency";

const CREATED_STATUS = 201;
const INVALID_STATUS = 422;

export async function POST(request: Request) {
  const blocked = await staffGuard(request, "dinas");
  if (blocked) {
    return blocked;
  }
  const entry = (await request.formData()).get("file");
  if (!(entry instanceof File) || entry.size === 0) {
    return errorResponse("VALIDATION_ERROR", "Pilih foto bukti terlebih dahulu.", INVALID_STATUS);
  }
  const outcome = await saveEvidence(entry);
  return outcome.ok
    ? Response.json(outcome.value, { status: CREATED_STATUS })
    : errorResponse("REJECTED", outcome.message, outcome.status);
}
